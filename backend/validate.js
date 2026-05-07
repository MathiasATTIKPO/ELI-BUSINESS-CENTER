#!/usr/bin/env node

/**
 * Validation Script - Vérifier que tout fonctionne
 * node validate.js
 */

const http = require('http');

const checks = [
  {
    name: 'Backend API',
    url: 'http://localhost:4001/api/health',
    expected: 'API is running'
  },
  {
    name: 'Tunnel Proxy',
    url: 'http://localhost:8080/api/health',
    expected: 'API is running'
  }
];

async function check(config) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    http.get(config.url, (res) => {
      let data = '';
      
      res.on('data', chunk => {
        data += chunk;
      });
      
      res.on('end', () => {
        const duration = Date.now() - startTime;
        
        try {
          const json = JSON.parse(data);
          const passed = JSON.stringify(json).includes(config.expected);
          
          resolve({
            name: config.name,
            passed,
            status: res.statusCode,
            duration,
            message: passed ? '✅ OK' : `❌ Expected "${config.expected}" but got different response`
          });
        } catch (e) {
          resolve({
            name: config.name,
            passed: false,
            status: res.statusCode,
            duration,
            message: `❌ Invalid JSON response`
          });
        }
      });
    }).on('error', (err) => {
      resolve({
        name: config.name,
        passed: false,
        status: 0,
        duration: Date.now() - startTime,
        message: `❌ Connection refused (${err.code})`
      });
    });
  });
}

async function validate() {
  console.log('\n' + '='.repeat(60));
  console.log('  ELI BUSINESS CENTER - Validation');
  console.log('='.repeat(60) + '\n');
  
  console.log('🔍 Vérification des services...\n');
  
  const results = [];
  
  for (const config of checks) {
    process.stdout.write(`  ${config.name}... `);
    const result = await check(config);
    results.push(result);
    
    if (result.passed) {
      console.log(`${result.message} (${result.duration}ms)`);
    } else {
      console.log(`${result.message} (${result.duration}ms)`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  
  const allPassed = results.every(r => r.passed);
  
  if (allPassed) {
    console.log('✅ Tous les services fonctionnent !');
    console.log('\n📍 Accès aux interfaces:');
    console.log('   Admin:     http://localhost:5174/admin/login');
    console.log('   Client:    http://localhost:5173');
    console.log('   API Docs:  http://localhost:4001/api-docs');
  } else {
    console.log('❌ Certains services ne répondent pas:');
    results.forEach(r => {
      if (!r.passed) {
        console.log(`   - ${r.name}: ${r.message}`);
      }
    });
    console.log('\n💡 Solutions:');
    console.log('   1. Vérifier que le backend tourne: cd backend && npm run dev');
    console.log('   2. Vérifier que le tunnel tourne (optionnel): cd backend && npm run tunnel');
    console.log('   3. Vérifier les pare-feu/antivirus');
    console.log('   4. Lire TUNNELING_GUIDE.md pour plus d\'aide');
  }
  
  console.log('='.repeat(60) + '\n');
  
  process.exit(allPassed ? 0 : 1);
}

validate();
