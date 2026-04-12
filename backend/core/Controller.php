<?php
namespace Core;

class Controller
{
    protected function json(mixed $data, int $code = 200): never
    {
        http_response_code($code);
        echo json_encode($data);
        exit;
    }

    protected function success(mixed $data = null, string $message = 'OK'): never
    {
        $this->json(['success' => true, 'message' => $message, 'data' => $data]);
    }

    protected function error(string $message, int $code = 422): never
    {
        $this->json(['success' => false, 'message' => $message], $code);
    }

    protected function input(): array
    {
        $ct = $_SERVER['CONTENT_TYPE'] ?? '';
        if (str_contains($ct, 'application/json')) {
            return json_decode(file_get_contents('php://input'), true) ?? [];
        }
        return $_POST;
    }

    protected function authUser(): array
    {
        return $_REQUEST['_auth_user'] ?? [];
    }

    protected function uploadFile(string $field): ?string
    {
        if (!isset($_FILES[$field]) || $_FILES[$field]['error'] !== UPLOAD_ERR_OK) return null;

        $file = $_FILES[$field];
        if ($file['size'] > MAX_FILE_SIZE) $this->error('File exceeds 2MB limit');

        $mime = (new \finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
        if (!in_array($mime, ALLOWED_MIME, true)) $this->error('Unsupported file type');

        $ext  = pathinfo($file['name'], PATHINFO_EXTENSION);
        $name = bin2hex(random_bytes(16)) . '.' . $ext;

        if (!move_uploaded_file($file['tmp_name'], UPLOAD_PATH . $name)) {
            $this->error('File upload failed');
        }

        return UPLOAD_URL . $name;
    }
}
