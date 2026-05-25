import { throwSentryServerActionError } from './actions';

export default function TestSentryServerAction() {
  return (
    <form action={throwSentryServerActionError}>
      <button type="submit">Trigger Server Action Error</button>
    </form>
  );
}
