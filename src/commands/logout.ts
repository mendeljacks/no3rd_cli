import { get_settings, write_settings } from '../helpers/settings'

export const logout = () => {
    const settings = get_settings()
    write_settings({ ...settings, token: undefined })
}
