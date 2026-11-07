<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

class NoteTagsTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private string $token;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = new User;
        $this->user->id = (string) Str::uuid();
        $this->user->name = 'User';
        $this->user->email = 'tags@example.com';
        $this->user->password = Hash::make('secret-password');
        $this->user->admin = false;
        $this->user->save();

        $this->token = $this->postJson('/v1/sessions', [
            'email' => 'tags@example.com',
            'password' => 'secret-password',
        ])->assertStatus(201)->json('token');
    }

    public function test_notes_keep_their_tags_and_can_be_filtered_by_them(): void
    {
        $created = $this->withToken($this->token)
            ->postJson('/v1/notes', [
                'title' => 'Tagged note',
                'content' => 'Body',
                'pinned' => false,
                'tags' => ['work', 'urgent'],
            ])
            ->assertStatus(201)
            ->assertJsonPath('tags.0', 'work')
            ->assertJsonPath('tags.1', 'urgent')
            ->json();

        $this->withToken($this->token)
            ->getJson('/v1/notes?filter=urgent')
            ->assertStatus(200)
            ->assertJsonCount(1)
            ->assertJsonPath('0.id', $created['id']);

        $this->withToken($this->token)
            ->putJson('/v1/notes/'.$created['id'], [
                'title' => 'Tagged note',
                'content' => 'Body',
                'pinned' => false,
                'tags' => ['home'],
            ])
            ->assertStatus(200)
            ->assertJsonPath('tags.0', 'home');
    }
}
