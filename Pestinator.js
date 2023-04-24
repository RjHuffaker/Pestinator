// ==UserScript==
// @name         Pestinator
// @namespace    https://github.com/RjHuffaker/Pestinator/blob/main/Pestinator.js
// @version      0.2
// @description  Provides various helper functions to PestPac and ServSuite, customized to our particular use-case.
// @author       Ryan Huffaker
// @match        app.west.pestpac.com/*
// @match        sprolive.theservicepro.net/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        window.focus
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
        link.href = 'https://RjHuffaker.github.io/scorpinator.css';
        document.getElementsByTagName("HEAD")[0].appendChild(link);
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
        function goToSSAccount(){
            window.open('https://sprolive.theservicepro.net/user/home.aspx');

            var xpath = "//span[text()='ServSuite']";
            var servSuiteLabel = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            var servSuiteText = servSuiteLabel.parentElement.lastChild;
            var servSuiteID = servSuiteText.textContent.substring(2);
            
            GM_setValue('PP_to_SS_ID', servSuiteID);
        }

        const ssLink = document.createElement('button');
        ssLink.innerHTML = 'ServSuite';
        ssLink.style.cursor = 'pointer';
        ssLink.classList.add("scorpinated");
        ssLink.onclick = goToSSAccount;

        const pageHeader = document.getElementById('page-header');
        pageHeader.appendChild(ssLink);
    }

    const ppLocationEdit = () => {
        const taxCodeInput = document.getElementById("TaxCode");
        taxCodeInput.value = "NO TAX";


    }

    const ppSearchDefault = () => {
        const goToPPAccount = (PPID) => {
            console.log('goToSSAccount');
            window.focus();
            const ssInput = document.getElementsByName('UserDef1')[0];
            ssInput.focus();
            ssInput.value = PPID;
            GM_setValue('SS_to_PP_ID', '');
            document.getElementById('butSearch').click();
        }

        GM_addValueChangeListener("SS_to_PP_ID", function(name, old_value, new_value, remote){});

        GM_addValueChangeListener("SS_to_PP_ID", function(name, old_value, new_value, remote){
            if(new_value){
                console.log('NEW SS_to_PP_ID VALUE', new_value);
                goToPPAccount(new_value);
            }
        });
    }

    const ssHome = () => {

        const goToSSAccount = (SSID) => {
            console.log('goToSSAccount');
            window.focus();
            const txtSearchCriteria = document.getElementById("txtSearchCriteria");
            txtSearchCriteria.focus();
            txtSearchCriteria.value = SSID;
            GM_setValue('PP_to_SS_ID', '');
            document.getElementById('search_button').click();
            document.getElementsByClassName('sorting_1')[0].children[0].click();
            window.close();
        }

        GM_addValueChangeListener("PP_to_SS_ID", function(name, old_value, new_value, remote){});

        GM_addValueChangeListener("PP_to_SS_ID", function(name, old_value, new_value, remote){
            console.log("PP_to_SS_ID listener");
            if(new_value){
                console.log('NEW PP_to_SS_ID VALUE', new_value);
                goToSSAccount(new_value);

            }
        });

    }

    const ssCustomerHome = () => {
        const goToPPAccount = () => {
            console.log('goToPPAccount');
            window.open('https://app.west.pestpac.com/search/default.asp');
            const PPID = document.getElementById('lbeditaccount').textContent.split(' ')[2];
            setTimeout(()=>{
                GM_setValue('SS_to_PP_ID', '');
                GM_setValue('SS_to_PP_ID', PPID);
            }, 2000);
        }

        const ppLink = document.createElement('button');
        ppLink.innerHTML = 'PestPac';
        ppLink.classList.add("scorpinated");
        ppLink.onclick = goToPPAccount;
        const accountLink = document.getElementById('lbeditaccount');
        accountLink.parentElement.appendChild(ppLink);
    }

    initializePestinator();

})();