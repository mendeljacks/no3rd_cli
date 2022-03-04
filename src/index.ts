#! /usr/bin/env node
// @ts-ignore
import { Command } from 'commander'
import { create_entity } from './commands/create'
import { login } from './commands/login'
import { logout } from './commands/logout'
const app = new Command()

app.command('logout').action(async () => {
    logout()
    console.log('Logged out')
})

app.command('login').action(async () => {
    const settings = await login()
    console.log(settings)
})

app.command('create <entity>')
    .option('-e, --external <command>', 'Use external command')
    .action(async (entity: string, args: { external?: string }) => {
        create_entity(entity, args)
    })

app.parse(process.argv)
