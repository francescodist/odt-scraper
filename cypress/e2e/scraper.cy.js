
Cypress.on('window:before:load', win => {
  win.open = () => {
    const selectedComune = win.document.querySelector('#listComuni option[selected="selected"]').innerHTML;
    win.fetch('Elenco.aspx')
      .then(resp => resp.status === 200 ? resp.blob() : Promise.reject('something went wrong'))
      .then(blob => {
        const url = win.URL.createObjectURL(blob);
        const a = win.document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        
        a.download = `${selectedComune.trim().replace(/[^A-Za-z0-9 \/\.\'\-]/g, ' - ').replace(/ +(?= )/g,'')}.pdf`;
        win.document.body.appendChild(a);
        a.click();
        win.URL.revokeObjectURL(url);
      }).catch(() => {
        console.log('failed to fetch', selectedComune.trim())
      })
  }
});

describe('template spec', () => {
  const provinciaList = ["AGRIGENTO","ALESSANDRIA","ANCONA","AOSTA","AREZZO","ASCOLI PICENO","ASTI","AVELLINO","BARI","BARLETTA-ANDRIA-TRANI","BELLUNO","BENEVENTO","BERGAMO","BIELLA","BOLOGNA","BOLZANO *BOZEN","BRESCIA","BRINDISI","CAGLIARI","CALTANISSETTA","CAMPOBASSO","CASERTA","CATANIA","CATANZARO","CHIETI","COMO","COSENZA","CREMONA","CROTONE","CUNEO","ENNA","FERMO","FERRARA","FIRENZE","FOGGIA","FORLI' CESENA","FROSINONE","GENOVA","GORIZIA","GROSSETO","IMPERIA","ISERNIA","L'AQUILA","LA SPEZIA","LATINA","LECCE","LECCO","LIVORNO","LODI","LUCCA","MACERATA","MANTOVA","MASSA CARRARA","MATERA","MESSINA","MILANO","MODENA","MONZA E BRIANZA","NAPOLI","NOVARA","NUORO","ORISTANO","PADOVA","PALERMO","PARMA","PAVIA","PERUGIA","PESARO URBINO","PESCARA","PIACENZA","PISA","PISTOIA","PORDENONE","POTENZA","PRATO","RAGUSA","RAVENNA","REGGIO DI CALABRIA","REGGIO NELL'EMILIA","RIETI","RIMINI","ROMA","ROVIGO","SALERNO","SASSARI","SAVONA","SIENA","SIRACUSA","SONDRIO","SUD SARDEGNA","TARANTO","TERAMO","TERNI","TORINO","TRAPANI","TRENTO","TREVISO","TRIESTE","UDINE","VARESE","VENEZIA","VERBANO CUSIO OSSOLA","VERCELLI","VERONA","VIBO VALENTIA","VICENZA","VITERBO"];
  provinciaList.forEach(provincia => {
    it(`scrapes the shit out of INPS OTDs for ${provincia}`, () => {
      cy.visit('https://servizi2.inps.it/servizi/elenchiannualiotd/default.aspx');
      cy.get('#listProv').as('provinciaSelect')
      cy.get('#listProv option').as('provinciaOptions');
      cy.get('#listComuni').as('comuniSelect');   
      cy.get('@provinciaOptions').should('have.length.greaterThan', 0)
      cy.task('logProgress', {i: provinciaList.indexOf(provincia), list: provinciaList})
      cy.task('getProvinciaDone').then(provinciaDone => {
        if(provincia < provinciaDone) return;
        cy.get('@provinciaSelect').select(provincia);
        cy.wait(300)
        cy.get('#listComuni option').as('comuniOptions');
        cy.get('@comuniOptions').should('have.length.greaterThan', 0)
        cy.get('@comuniOptions').each(comune => {
          cy.task('checkExists', `cypress/downloads/${provincia}/${comune.text().trim()}.pdf`).then(alreadyExists => {
            if(!alreadyExists) {
              cy.get('@comuniSelect').should('be.visible')
              cy.get('@comuniSelect').select(comune.text().trim());
              cy.get('#btnCerca').click()
              cy.wait(3300)
              cy.task('moveFile', {
                from: `cypress/downloads/${comune.text().trim()}.pdf`,
                to: `cypress/downloads/${provincia}/${comune.text().trim()}.pdf`
              })
            }
          })       
        })
        cy.task('storeProvinciaDone', provincia)
      })
      
    })
  })
  
})