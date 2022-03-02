import * as fs from 'fs'

fs.mkdirSync('./generated', { recursive: true })
export const settings_path = './generated/settings.json'

export const get_settings = (): { base_url?: string; token?: string | undefined } => {
    const settings = fs.existsSync(settings_path)
        ? JSON.parse(fs.readFileSync(settings_path, 'utf-8') || '{}')
        : {}
    return settings
}

export const write_settings = settings => {
    fs.writeFileSync(settings_path, JSON.stringify(settings, null, 4))
}
