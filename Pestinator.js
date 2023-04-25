// ==UserScript==
// @name         Pestinator
// @namespace    https://github.com/RjHuffaker/Pestinator/blob/main/Pestinator.js
// @version      0.300
// @description  Provides various helper functions to PestPac and ServSuite, customized to our particular use-case.
// @author       Ryan Huffaker
// @match        app.west.pestpac.com/*
// @match        sprolive.theservicepro.net/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        window.focus
// @grant        window.close
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_addValueChangeListener
// @grant        GM_removeValueChangeListener
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    function urlContains(list){
        let yesItDoes = false;
        for(let i = 0; i < list.length; i++){
            if(window.location.href.indexOf(list[i]) > -1) {
                yesItDoes = true;
            }
        }
        return yesItDoes;
    }

    function retrieveCSS(){
        var link = window.document.createElement('link');
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = 'https://github.com/RjHuffaker/Pestinator/blob/main/Pestinator.css';
        document.getElementsByTagName("HEAD")[0].appendChild(link);
    }

    function getSsid(){
        const xpath = "//span[text()='ServSuite']";
        const servSuiteLabel = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        const servSuiteText = servSuiteLabel.parentElement.lastChild;
        return servSuiteText.textContent.substring(2);
    }

    function getWeekday(input){
        const date = new Date(input);
        return ["SUN","MON","TUE","WED","THU","FRI","SAT"][date.getDay()];
    }

    function getWeek(input){
        const date = new Date(input);
        let week = Math.ceil(date.getDate()/7);
        return week < 5 ? week : 4;
    }

    function getMonth(input){
        const date = new Date(input);
        return ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"][date.getMonth()];
    }

    function convertService(service){
        console.log(service);
        let serviceCode;
        [
            { input: "General Pest Control - Weekly", output: "PC-WEEKLY" },
            { input: "General Pest Control - Monthly", output: "PC-MONTHLY" },
            { input: "General Pest Control - Bi Monthly", output: "PC-BIMONTHLY" },
            { input: "General Pest Control - Quarterly", output: "PC-QUARTERLY" },
        ].forEach((obj)=>{
            if(service === obj.input){
                serviceCode = obj.output
            }
        });
        return serviceCode;
    }

    function parseSchedule(service, month, week, day){
        let schedule;
        [
            { input: "PC-WEEKLY", output: "W" },
            { input: "PC-MONTHLY", output: "M" },
            { input: "PC-BIMONTHLY", output: "B" },
            { input: "PC-QUARTERLY", output: "Q" }
        ].forEach((obj)=>{
            if(service === obj.input){
                schedule = obj.output+month+week+day;
            }
        });
        return schedule;
    }

    const initializePestinator = () => {
        if(urlContains(["app.west.pestpac.com/location/detail.asp"])){
            retrieveCSS();
            ppLocationDetail();
        }
        if(urlContains(["app.west.pestpac.com/location/edit.asp"])){
            retrieveCSS();
            ppLocationEdit();
        }
        if(urlContains(["app.west.pestpac.com/search/default.asp"])){
            retrieveCSS();
            ppSearchDefault();
        }
        if(urlContains(["app.west.pestpac.com/serviceSetup/detail.asp"])){
            retrieveCSS();
            ppServiceSetup();
        }
        if(urlContains(["sprolive.theservicepro.net/user/home.aspx"])){
            retrieveCSS();
            ssHome();
        }
        if(urlContains(["sprolive.theservicepro.net/account/customerhome.aspx"])){
            retrieveCSS();
            ssCustomerHome();
        }
    }

    const ppLocationDetail = () => {
        const goToSSHandler = () => {
            window.open('https://sprolive.theservicepro.net/user/home.aspx');
            const ssid = getSsid();
            GM_setValue('PP_to_SS', {id: ssid});
        }

        const addServiceSetup = () => {
            document.getElementById('recurringServicesContainer').children[0].children[0].children[0].children[1].click();
            document.getElementsByClassName('pendo-location-recurring-service__add-setup')[0].click();
        }

        const ssLink = document.createElement('button');
        ssLink.innerHTML = 'ServSuite';
        ssLink.style.cursor = 'pointer';
        ssLink.classList.add('pestinated');
        ssLink.onclick = goToSSHandler;

        const pageHeader = document.getElementById('page-header');
        pageHeader.appendChild(ssLink);

        GM_deleteValue('SS_to_PP');

        const SS_program = GM_getValue('SS_program');

        const ssid = getSsid();

        if(SS_program && SS_program.id !== ssid){
            if(confirm(SS_program.id+" != "+ssid)){
                addServiceSetup();
            }
        } else if(SS_program && SS_program.id !== ssid){
            addServiceSetup();
        }
    }

    const ppLocationEdit = () => {
        const taxCodeInput = document.getElementById('TaxCode');
        taxCodeInput.value = 'NO TAX';

        const ssInput = document.getElementById('UserDef1');
        const ssid = ssInput.value;
        ssInput.value = ("0000" + ssid).slice(-5);
    }

    const ppSearchDefault = () => {
        const goToPPListener = (PPID) => {
            const ssInput = document.getElementsByName('UserDef1')[0];
            ssInput.focus();
            ssInput.value = PPID;
            document.getElementById('butSearch').click();
        }

        const SS_to_PP = GM_getValue('SS_to_PP');
        GM_deleteValue('SS_to_PP');

        console.log(SS_to_PP);


        if(SS_to_PP){
            goToPPListener(SS_to_PP.id);
        }
    }

    const ssHome = () => {

        console.log('ssHome');
        const goToSSListener = (ssid) => {
            const txtSearchCriteria = document.getElementById("txtSearchCriteria");
            txtSearchCriteria.focus();
            txtSearchCriteria.value = ssid;
            GM_deleteValue('PP_to_SS');
            document.getElementById('search_button').click();
            setTimeout(() => {
                window.close();
            }, 2000);
        }

        const PP_to_SS = GM_getValue('PP_to_SS');

        if(PP_to_SS){
            goToSSListener(PP_to_SS.id);
        }
    }

    const ssCustomerHome = () => {
        const goToPPHandler = () => {
            const newWindow = window.open('https://app.west.pestpac.com/search/default.asp');
            const id = document.getElementById('lbeditaccount').textContent.split(' ')[2];
            GM_setValue('SS_to_PP', {id: id});
        }

        const ppLink = document.createElement('button');
        ppLink.innerHTML = 'PestPac';
        ppLink.classList.add("pestinated");
        ppLink.onclick = goToPPHandler;
        const accountLink = document.getElementById('lbeditaccount');
        accountLink.parentElement.appendChild(ppLink);

        setTimeout(()=>{
            const programTables = document.getElementsByClassName('programdetails');

            let programDetails = [];

            const copyProgram = (i) => {
                let program = programDetails[i];
                program.id = document.getElementById('lbeditaccount').textContent.split(' ')[2];
                console.log(program);
                GM_setValue('SS_program', program);
            }

            Array.from(programTables).forEach((table, i) => {
                if(table.children[0]?.children){
                    let program = {};
                    program.service = table.children[0].children[1].children[1].children[0].textContent;
                    program.lastDate = table.children[0].children[1].children[2].textContent;
                    program.nextDate = table.children[0].children[1].children[3].textContent;
                    program.cancel = table.children[0].children[1].children[4].textContent;
                    program.ammount = table.children[0].children[1].children[5].textContent;
                    program.prodAmmount = table.children[0].children[1].children[6].textContent;
                    program.route = table.children[0].children[1].children[7].textContent;

                    programDetails.push(program);

                    const ppLink = document.createElement('button');
                    ppLink.innerHTML = 'PP';
                    ppLink.onclick = (e) => { e.preventDefault(); copyProgram(i); }
                    table.children[0].children[1].children[0].replaceChildren(ppLink);
                }
            });
        },1000);
    }

    const ppServiceSetup = () => {
        const enterSetupDetails = (program) => {
            const lastDate = new Date(program.lastDate)
            const weekday = getWeekday(lastDate);
            const week = getWeek(lastDate);
            const month = getMonth(lastDate);
            const serviceCode = convertService(program.service);
            const schedule = parseSchedule(serviceCode, month, week, weekday);

            const serviceCodeInput = document.getElementById('ServiceCode1');
            const unitPriceInput = document.getElementById('UnitPrice1');
            const scheduleInput = document.getElementById('Schedule');
            const routeInput = document.getElementById('Route');

            serviceCodeInput.focus();
            serviceCodeInput.value = serviceCode;
            serviceCodeInput.blur();

            scheduleInput.focus();
            scheduleInput.value = schedule;
            scheduleInput.blur();

            unitPriceInput.focus();
            unitPriceInput.value = program.ammount.replace('$','');
            unitPriceInput.blur();

            routeInput.focus();
            routeInput.value = program.route;
            routeInput.blur();
        }

        const program = GM_getValue('SS_program');
        GM_deleteValue('SS_program');

        if(program) enterSetupDetails(program);

    }

    initializePestinator();

})();