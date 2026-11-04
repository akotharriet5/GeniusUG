<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

// Requires Laravel Sanctum (php artisan install:api) and HasApiTokens on the User model.
class AuthController extends Controller
{
    /** Anyone can log in; the admin panel itself refuses non-admin roles. */
    public function login(Request $request): JsonResponse
    {
        $data = $request->validate(['email' => ['required', 'email'], 'password' => ['required']]);

        $user = User::where('email', $data['email'])->first();
        if (!$user || !Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages(['email' => 'Wrong email or password.']);
        }
        return $this->session($user, 'login');
    }

    /** Public sign-up. ALWAYS creates a parent; the role cannot be chosen by the caller. */
    public function register(Request $request): JsonResponse
    {
        $user = $this->createUser($this->validatedSignup($request), 'parent');
        return $this->session($user, 'register', 201);
    }

    /** Tells the admin panel whether to offer "create first admin". */
    public function setupStatus(): JsonResponse
    {
        return response()->json(['needs_setup' => !User::where('role', 'admin')->exists()]);
    }

    /** Creates the very first admin. Refuses as soon as any admin exists. */
    public function setupAdmin(Request $request): JsonResponse
    {
        if (User::where('role', 'admin')->exists()) {
            return response()->json(['message' => 'Setup already completed.'], 403);
        }
        $user = $this->createUser($this->validatedSignup($request), 'admin');
        return $this->session($user, 'admin-web', 201);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['ok' => true]);
    }

    // ---------- helpers ----------

    private function validatedSignup(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:150', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],   // needs password_confirmation
        ]);
    }

    private function createUser(array $data, string $role): User
    {
        $user = new User();
        // forceFill so we don't have to add 'role' to $fillable (which would let requests set it).
        $user->forceFill([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'role' => $role,
        ])->save();
        return $user;
    }

    private function session(User $user, string $tokenName, int $status = 200): JsonResponse
    {
        return response()->json([
            'token' => $user->createToken($tokenName)->plainTextToken,
            'user' => ['id' => $user->id, 'name' => $user->name, 'email' => $user->email, 'role' => $user->role],
        ], $status);
    }
}
