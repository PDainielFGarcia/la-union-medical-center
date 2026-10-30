import { Button } from './Button'

export function ErrorState({ message = 'Unable to load data.', onRetry }) {
  return (
    <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-center" role="alert">
      <p className="text-sm font-medium text-red-700">{message}</p>
      {onRetry ? (
        <Button className="mt-3" variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  )
}
