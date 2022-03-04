import { prompt } from 'inquirer'
import axios from 'axios'
import { get_settings, write_settings } from '../helpers/settings'

export const login = async () => {
    const settings = get_settings()

    if (!settings.token) {
        const answers = await prompt([
            {
                type: 'list',
                choices: [
                    'https://api.no3rd.ca',
                    'https://no3rd-api-dev.herokuapp.com',
                    'http://localhost:3001'
                ],
                name: 'base_url',
                message: 'Which base_url?'
            },
            { type: 'input', name: 'email', message: 'What is your email?' },
            { type: 'password', name: 'password', message: 'What is your password?' }
        ])

        const response = await axios({
            url: answers.base_url + '/login',
            params: {
                email: answers.email,
                password: answers.password
            }
        })

        const token = response?.data?.token
        write_settings({ ...settings, token, base_url: answers.base_url })
        return { ...settings, token }
    }

    return settings
}
