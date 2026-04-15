<?php
namespace App\Controllers;

use App\Models\Leave;
use Core\Controller;

class LeaveController extends Controller
{
    private Leave $model;

    public function __construct()
    {
        $this->model = new Leave();
    }

    public function adminIndex(array $params = []): never
    {
        $this->success($this->model->allWithUser());
    }

    public function userIndex(array $params = []): never
    {
        $auth = $this->authUser();
        $this->success($this->model->forUser((int)$auth['id']));
    }

    public function store(array $params = []): never
    {
        $auth = $this->authUser();
        $data = $this->input();

        $start = $data['start_date'] ?? '';
        $end   = $data['end_date']   ?? '';
        if (!$start || !$end) $this->error('Start and end dates are required');

        $id = $this->model->create([
            'user_id'    => (int)$auth['id'],
            'leave_type' => $data['leave_type'] ?? 'annual',
            'start_date' => $start,
            'end_date'   => $end,
            'reason'     => $data['reason'] ?? '',
            'status'     => 'pending',
        ]);
        $this->success(['id' => $id], 'Leave request submitted');
    }

    public function review(array $params = []): never
    {
        $id     = (int)($params['id'] ?? 0);
        $auth   = $this->authUser();
        $data   = $this->input();
        $status = $data['status'] ?? '';

        if (!in_array($status, ['approved', 'rejected'], true)) {
            $this->error('Status must be approved or rejected');
        }

        $this->model->update($id, [
            'status'      => $status,
            'reviewed_by' => (int)$auth['id'],
            'reviewed_at' => date('c'),
        ]);
        $this->success(null, 'Leave ' . $status);
    }

    public function destroy(array $params = []): never
    {
        $id = (int)($params['id'] ?? 0);
        $this->model->softDelete($id);
        $this->success(null, 'Leave deleted');
    }
}
