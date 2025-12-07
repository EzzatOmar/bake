
// client.ts
import { treaty } from '@elysiajs/eden'
import type { App } from '../index'

const client = treaty<App>('localhost:3000') 

const { data: health, error: healthError } = await client.api.health.get()
if(healthError) {
    console.error(healthError.value)
}
else {
    console.log(health.status)

}
