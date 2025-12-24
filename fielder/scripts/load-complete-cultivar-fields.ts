#!/usr/bin/env tsx
import { runWriteTransaction, closeDriver } from '../src/lib/graph/index'
import { CULTIVARS } from '../src/lib/constants/products'

/**
 * Load ALL cultivar fields from TypeScript to Neo4j
 *
 * From marathon session assessment, only ~5 fields were loaded initially:
 * - id, name, productType, heritageIntent, source
 *
 * This script loads ALL remaining fields:
 * - displayName, technicalName, tradeNames
 * - modelType
 * - Heritage: isHeritage, isNonGmo, originLocked, yearIntroduced, originStory, heritageStatus
 * - Geographic: validatedStates
 * - Quality: flavorProfile, nutritionNotes
 * - Timing: ripeningBehavior, daysToRipenAmbient, storageLifeWeeks
 * - GDD: baseTemp, gddToMaturity, gddToPeak, gddWindowWidth
 * - Calendar: peakMonths, harvestMonths
 */

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║  LOAD COMPLETE CULTIVAR FIELDS TO NEO4J                ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')
  console.log(`Processing ${CULTIVARS.length} cultivars...\n`)

  let updated = 0
  let fieldsAdded = {
    displayName: 0,
    technicalName: 0,
    tradeNames: 0,
    modelType: 0,
    isHeritage: 0,
    isNonGmo: 0,
    originLocked: 0,
    yearIntroduced: 0,
    originStory: 0,
    heritageStatus: 0,
    validatedStates: 0,
    flavorProfile: 0,
    nutritionNotes: 0,
    ripeningBehavior: 0,
    daysToRipenAmbient: 0,
    storageLifeWeeks: 0,
    baseTemp: 0,
    gddToMaturity: 0,
    gddToPeak: 0,
    gddWindowWidth: 0,
    peakMonths: 0,
    harvestMonths: 0,
  }

  for (const cultivar of CULTIVARS) {
    // Build SET clauses dynamically based on what fields exist
    const setFields: string[] = []
    const params: Record<string, any> = { id: cultivar.id }

    // === NAMING ===
    if (cultivar.displayName) {
      setFields.push('c.displayName = $displayName')
      params.displayName = cultivar.displayName
      fieldsAdded.displayName++
    }

    if (cultivar.technicalName) {
      setFields.push('c.technicalName = $technicalName')
      params.technicalName = cultivar.technicalName
      fieldsAdded.technicalName++
    }

    if (cultivar.tradeNames && cultivar.tradeNames.length > 0) {
      setFields.push('c.tradeNames = $tradeNames')
      params.tradeNames = cultivar.tradeNames
      fieldsAdded.tradeNames++
    }

    // === MODEL TYPE ===
    if (cultivar.modelType) {
      setFields.push('c.modelType = $modelType')
      params.modelType = cultivar.modelType
      fieldsAdded.modelType++
    }

    // === HERITAGE (H PILLAR) ===
    if (cultivar.isHeritage !== undefined) {
      setFields.push('c.isHeritage = $isHeritage')
      params.isHeritage = cultivar.isHeritage
      fieldsAdded.isHeritage++
    }

    if (cultivar.isNonGmo !== undefined) {
      setFields.push('c.isNonGmo = $isNonGmo')
      params.isNonGmo = cultivar.isNonGmo
      fieldsAdded.isNonGmo++
    }

    if (cultivar.originLocked !== undefined) {
      setFields.push('c.originLocked = $originLocked')
      params.originLocked = cultivar.originLocked
      fieldsAdded.originLocked++
    }

    if (cultivar.yearIntroduced) {
      setFields.push('c.yearIntroduced = $yearIntroduced')
      params.yearIntroduced = cultivar.yearIntroduced
      fieldsAdded.yearIntroduced++
    }

    if (cultivar.originStory) {
      setFields.push('c.originStory = $originStory')
      params.originStory = cultivar.originStory
      fieldsAdded.originStory++
    }

    if (cultivar.heritageStatus) {
      setFields.push('c.heritageStatus = $heritageStatus')
      params.heritageStatus = cultivar.heritageStatus
      fieldsAdded.heritageStatus++
    }

    // === GEOGRAPHIC (S PILLAR CONNECTION) ===
    if (cultivar.validatedStates && cultivar.validatedStates.length > 0) {
      setFields.push('c.validatedStates = $validatedStates')
      params.validatedStates = cultivar.validatedStates
      fieldsAdded.validatedStates++
    }

    // === QUALITY (E PILLAR) ===
    if (cultivar.flavorProfile) {
      setFields.push('c.flavorProfile = $flavorProfile')
      params.flavorProfile = cultivar.flavorProfile
      fieldsAdded.flavorProfile++
    }

    if (cultivar.nutritionNotes) {
      setFields.push('c.nutritionNotes = $nutritionNotes')
      params.nutritionNotes = cultivar.nutritionNotes
      fieldsAdded.nutritionNotes++
    }

    // === TIMING (R PILLAR) ===
    if (cultivar.ripeningBehavior) {
      setFields.push('c.ripeningBehavior = $ripeningBehavior')
      params.ripeningBehavior = cultivar.ripeningBehavior
      fieldsAdded.ripeningBehavior++
    }

    if (cultivar.daysToRipenAmbient !== undefined) {
      setFields.push('c.daysToRipenAmbient = $daysToRipenAmbient')
      params.daysToRipenAmbient = cultivar.daysToRipenAmbient
      fieldsAdded.daysToRipenAmbient++
    }

    if (cultivar.storageLifeWeeks !== undefined) {
      setFields.push('c.storageLifeWeeks = $storageLifeWeeks')
      params.storageLifeWeeks = cultivar.storageLifeWeeks
      fieldsAdded.storageLifeWeeks++
    }

    // === GDD (R PILLAR) ===
    if (cultivar.baseTemp !== undefined) {
      setFields.push('c.baseTemp = $baseTemp')
      params.baseTemp = cultivar.baseTemp
      fieldsAdded.baseTemp++
    }

    if (cultivar.gddToMaturity !== undefined) {
      setFields.push('c.gddToMaturity = $gddToMaturity')
      params.gddToMaturity = cultivar.gddToMaturity
      fieldsAdded.gddToMaturity++
    }

    if (cultivar.gddToPeak !== undefined) {
      setFields.push('c.gddToPeak = $gddToPeak')
      params.gddToPeak = cultivar.gddToPeak
      fieldsAdded.gddToPeak++
    }

    if (cultivar.gddWindowWidth !== undefined) {
      setFields.push('c.gddWindowWidth = $gddWindowWidth')
      params.gddWindowWidth = cultivar.gddWindowWidth
      fieldsAdded.gddWindowWidth++
    }

    // === CALENDAR (R PILLAR) ===
    if (cultivar.peakMonths && cultivar.peakMonths.length > 0) {
      setFields.push('c.peakMonths = $peakMonths')
      params.peakMonths = cultivar.peakMonths
      fieldsAdded.peakMonths++
    }

    if (cultivar.harvestMonths && cultivar.harvestMonths.length > 0) {
      setFields.push('c.harvestMonths = $harvestMonths')
      params.harvestMonths = cultivar.harvestMonths
      fieldsAdded.harvestMonths++
    }

    // Execute update if we have fields to set
    if (setFields.length > 0) {
      const setClause = setFields.join(',\n          ')

      await runWriteTransaction(`
        MATCH (c:Cultivar {id: $id})
        SET ${setClause}
        RETURN c.id as id
      `, params)

      updated++

      // Show progress
      if (updated % 10 === 0) {
        console.log(`  ✓ Updated ${updated}/${CULTIVARS.length} cultivars`)
      }
    }
  }

  console.log(`\n✓ Updated ${updated} cultivars with complete field data\n`)

  // === SUMMARY OF FIELDS ADDED ===
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║  FIELD POPULATION SUMMARY                              ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  console.log('NAMING:')
  console.log(`  displayName:      ${fieldsAdded.displayName}`)
  console.log(`  technicalName:    ${fieldsAdded.technicalName}`)
  console.log(`  tradeNames:       ${fieldsAdded.tradeNames}`)

  console.log('\nMODEL:')
  console.log(`  modelType:        ${fieldsAdded.modelType}`)

  console.log('\nHERITAGE (H PILLAR):')
  console.log(`  isHeritage:       ${fieldsAdded.isHeritage}`)
  console.log(`  isNonGmo:         ${fieldsAdded.isNonGmo}`)
  console.log(`  heritageStatus:   ${fieldsAdded.heritageStatus}`)
  console.log(`  originLocked:     ${fieldsAdded.originLocked}`)
  console.log(`  yearIntroduced:   ${fieldsAdded.yearIntroduced}`)
  console.log(`  originStory:      ${fieldsAdded.originStory}`)

  console.log('\nGEOGRAPHIC (S PILLAR):')
  console.log(`  validatedStates:  ${fieldsAdded.validatedStates}`)

  console.log('\nQUALITY (E PILLAR):')
  console.log(`  flavorProfile:    ${fieldsAdded.flavorProfile}`)
  console.log(`  nutritionNotes:   ${fieldsAdded.nutritionNotes}`)

  console.log('\nTIMING (R PILLAR):')
  console.log(`  ripeningBehavior: ${fieldsAdded.ripeningBehavior}`)
  console.log(`  daysToRipenAmb:   ${fieldsAdded.daysToRipenAmbient}`)
  console.log(`  storageLifeWeeks: ${fieldsAdded.storageLifeWeeks}`)
  console.log(`  peakMonths:       ${fieldsAdded.peakMonths}`)
  console.log(`  harvestMonths:    ${fieldsAdded.harvestMonths}`)

  console.log('\nGDD (R PILLAR):')
  console.log(`  baseTemp:         ${fieldsAdded.baseTemp}`)
  console.log(`  gddToMaturity:    ${fieldsAdded.gddToMaturity}`)
  console.log(`  gddToPeak:        ${fieldsAdded.gddToPeak}`)
  console.log(`  gddWindowWidth:   ${fieldsAdded.gddWindowWidth}`)

  // === VERIFICATION QUERY ===
  console.log('\n╔════════════════════════════════════════════════════════╗')
  console.log('║  VERIFICATION                                          ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  const verifyQuery = `
    MATCH (c:Cultivar {id: 'navel_orange'})
    RETURN c.id as id,
           c.displayName as displayName,
           c.modelType as modelType,
           c.isNonGmo as isNonGmo,
           c.validatedStates as validatedStates,
           c.flavorProfile as flavorProfile,
           c.peakMonths as peakMonths
  `

  const result = await runWriteTransaction(verifyQuery, {})

  if (result.length > 0) {
    const c = result[0]
    console.log('Sample cultivar (navel_orange):')
    console.log(`  ID: ${c.id}`)
    console.log(`  Display Name: ${c.displayName}`)
    console.log(`  Model Type: ${c.modelType}`)
    console.log(`  Non-GMO: ${c.isNonGmo}`)
    console.log(`  Validated States: ${c.validatedStates?.join(', ')}`)
    console.log(`  Flavor: ${c.flavorProfile}`)
    console.log(`  Peak Months: ${c.peakMonths?.join(', ')}`)
  }

  console.log('\n╔════════════════════════════════════════════════════════╗')
  console.log('║  COMPLETE CULTIVAR FIELDS LOADED                       ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  await closeDriver()
}

main().catch(console.error)
