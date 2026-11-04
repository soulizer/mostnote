<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

class SessionResponseTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = new User;
        $this->user->id = (string) Str::uuid();
        $this->user->name = 'User';
        $this->user->email = 'user@example.com';
        $this->user->password = Hash::make('secret-password');
        $this->user->admin = false;
        $this->user->save();
    }

    public function test_login_returns_an_iso_8601_expiration_in_the_future(): void
    {
        $expiresAt = $this->postJson('/v1/sessions', [
            'email' => 'user@example.com',
            'password' => 'secret-password',
        ])->assertStatus(201)->json('expires_at');

        $this->assertMatchesRegularExpression(
            '/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/',
            $expiresAt
        );

        $expiration = new \DateTimeImmutable($expiresAt);
        $expected = (new \DateTimeImmutable)->modify('+'.config('session.lifetime').' minutes');

        $this->assertEqualsWithDelta(
            $expected->getTimestamp(),
            $expiration->getTimestamp(),
            60
        );
    }

    public function test_expired_session_token_is_rejected(): void
    {
        $token = $this->postJson('/v1/sessions', [
            'email' => 'user@example.com',
            'password' => 'secret-password',
        ])->assertStatus(201)->json('token');

        $this->travel(config('session.lifetime') + 1)->minutes();

        $this->app['auth']->forgetGuards();

        $this->withToken($token)
            ->getJson('/v1/users/'.$this->user->id)
            ->assertStatus(401);
    }
}
