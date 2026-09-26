import type { Config } from 'tailwindcss'
import karbitPreset from '@wearesyntesa/karbit-ui/tailwind.config'

const config: Config = {
  presets: [karbitPreset],
  content: ['./src/**/*.{html,js,ts,jsx,tsx}', './node_modules/@wearesyntesa/karbit-ui/dist/**/*.js'],
}

export default config