#!/usr/bin/env tsx
import { runWriteTransaction, closeDriver } from '../src/lib/graph/index'
import * as fs from 'fs'

const data = `variety,rootstock,date_planted,date_measured,tree_age_years,brix,acid,ratio
Southern Frost Navel,Flying Dragon,2017,2021-12-15,4,11.7,0.64,18.3
Glen Navel,Sour Orange,2014,2021-12-15,7,9.4,0.84,11.2
Glen Navel,US-852,2017,2021-12-15,4,10.2,0.75,13.6
Cara Navel,US-897,2018,2021-12-15,3,9.5,0.73,13.0
Washington Navel,US-852,2017,2021-12-15,4,10.0,0.65,15.4
Sugar Belle Mandarin,US-942,2018,2021-12-15,3,13.1,1.62,8.1
Sugar Belle Mandarin,US-897,2018,2021-12-15,3,13.3,1.78,7.5
Sugar Belle Mandarin,US-852,2018,2021-12-15,3,12.7,1.48,8.6
Sugar Belle Mandarin,Rubidoux,2018,2021-12-15,3,13.7,1.65,8.3
Sugar Belle Mandarin,X-639,2015,2021-12-15,6,12.1,1.53,7.9
Sugar Belle Mandarin,Goutou,2017,2021-12-15,4,12.0,1.11,10.8
Shiranui Mandarin,US-942,2019,2021-12-15,2,11.0,1.01,10.9
Shiranui Mandarin,US-852,2018,2021-12-15,3,11.7,1.30,9.0
Shiranui Mandarin,US-897,2016,2021-12-15,5,13.5,1.38,9.8
Shiranui Mandarin,Swingle,2015,2021-12-15,6,11.8,1.57,7.5
Owari Satsuma,Kuharski Carrizo,2014,2021-12-15,7,11.4,0.78,14.6
Fairchild Mandarin,Flying Dragon,2009,2021-12-15,12,16.1,0.93,17.3`.split('\n').slice(1)

async function main() {
  console.log('Loading Georgia citrus validation data...\n')

  let loaded = 0

  for (const line of data) {
    const [variety, rootstock, planted, measured, age, brix, acid, ratio] = line.split(',')

    await runWriteTransaction(`
      CREATE (m:Measurement:GeorgiaCitrus {
        id: 'georgia_' + randomUUID(),
        source: 'georgia_uga_2021',
        variety: $variety,
        rootstock: $rootstock,
        datePlanted: $planted,
        dateMeasured: $measured,
        treeAgeYears: $age,
        location: 'Valdosta, GA (Lowndes County)',
        brix: $brix,
        acid: $acid,
        ratio: $ratio
      })
    `, {
      variety,
      rootstock,
      planted,
      measured,
      age: parseInt(age),
      brix: parseFloat(brix),
      acid: parseFloat(acid),
      ratio: parseFloat(ratio),
    })

    loaded++
  }

  console.log(`✓ Loaded ${loaded} Georgia measurements\n`)

  await closeDriver()
}

main().catch(console.error)
