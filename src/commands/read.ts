import axios from 'axios'
import { get_settings } from '../helpers/settings'

export type ReadParams = {
    query?: Object
    inline?: boolean
    external?: boolean
    with?: boolean
}
export const read_entity = async (args: ReadParams) => {
    const { token, base_url } = get_settings()
    if (!token) {
        console.error('Not logged in')
        return
    }

    const response = await axios({
        url: base_url + '/query',
        headers: { Authorization: `Bearer ${token}` },
        data: args.query,
        method: 'post'
    })

    const root_entity = Object.keys(args.query).filter(el => el !== 'meta')[0]

    console.table(response.data[root_entity])
}
