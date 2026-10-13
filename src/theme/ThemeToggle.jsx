import { Button } from 'primereact/button'
import { useTheme } from './ThemeProvider'

/** Shows the icon of the theme you will get, which is the usual convention. */
export default function ThemeToggle() {
  const { mode, toggle } = useTheme()
  const next = mode === 'dark' ? 'light' : 'dark'
  return (
    <Button
      icon={next === 'light' ? 'pi pi-sun' : 'pi pi-moon'}
      onClick={toggle}
      rounded
      text
      severity="secondary"
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
    />
  )
}
