---
inclusion: manual
---

# Skill: Add a New Frontend Component

Use this skill when creating a new React component in `client/src/components/`.

## Checklist

1. **Create the file** using PascalCase: `client/src/components/MyComponent.tsx`

2. **Define a props interface** at the top of the file:
   ```tsx
   interface MyComponentProps {
     id: string;
     onSelect?: (id: string) => void;
   }
   ```

3. **Use a named export** (not default only):
   ```tsx
   export function MyComponent({ id, onSelect }: MyComponentProps): JSX.Element {
   ```

4. **Add `data-testid` attributes** on all interactive and key display elements:
   ```tsx
   <button data-testid="my-action-btn">Action</button>
   <div data-testid="my-result">...</div>
   ```

5. **Style with Tailwind only** — no inline `style` props, no CSS modules:
   ```tsx
   <div className="rounded-lg border border-gray-200 bg-white p-4">
   ```

6. **Handle all fetch states** when making API calls:
   ```tsx
   const [data, setData] = useState(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   ```

7. **Create a test file** at `client/tests/MyComponent.test.tsx`
   - Stub `fetch` for all API calls
   - Test loading state, error state, empty state, and happy path
   - Use `getByRole` > `getByLabelText` > `getByTestId` query priority

## Fetch Pattern

```tsx
useEffect(() => {
  let cancelled = false;
  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/resource');
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      const body = await res.json();
      if (!cancelled) setData(body);
    } catch (err) {
      if (!cancelled) setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      if (!cancelled) setLoading(false);
    }
  }
  load();
  return () => { cancelled = true; };
}, []);
```

## Error and Empty States

Always include:
- Loading: spinner or text indicator
- Error: `data-testid="component-error"` + Retry button `data-testid="retry-component"`
- Empty: `data-testid="component-empty"` with helpful message
