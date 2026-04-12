<?php
namespace Core;

class JWT
{
    public static function encode(array $payload): string
    {
        $header  = self::b64e(json_encode(['typ' => 'JWT', 'alg' => 'HS256']));
        $payload = array_merge($payload, ['iat' => time(), 'exp' => time() + JWT_EXPIRY]);
        $body    = self::b64e(json_encode($payload));
        $sig     = self::b64e(hash_hmac('sha256', "{$header}.{$body}", JWT_SECRET, true));
        return "{$header}.{$body}.{$sig}";
    }

    public static function decode(string $token): array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) throw new \InvalidArgumentException('Malformed token');

        [$header, $body, $sig] = $parts;
        $expected = self::b64e(hash_hmac('sha256', "{$header}.{$body}", JWT_SECRET, true));

        if (!hash_equals($expected, $sig)) throw new \InvalidArgumentException('Invalid signature');

        $data = json_decode(self::b64d($body), true);
        if (($data['exp'] ?? 0) < time()) throw new \InvalidArgumentException('Token expired');

        return $data;
    }

    private static function b64e(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function b64d(string $data): string
    {
        return base64_decode(strtr($data, '-_', '+/'));
    }
}
