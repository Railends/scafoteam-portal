-- Sync status column from admin_data if they differ
UPDATE public.workers
SET status = admin_data->>'status'
WHERE status IS DISTINCT FROM (admin_data->>'status')
AND admin_data->>'status' IS NOT NULL;

-- Ensure status is not null (default to pending)
UPDATE public.workers
SET status = 'pending'
WHERE status IS NULL;
