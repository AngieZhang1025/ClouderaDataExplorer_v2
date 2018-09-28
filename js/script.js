/**
 * Logic and html generation for the script section
 */
define(function () {
    
    var vScriptArray = [];                          //Contains Script
    var vSelectedTableProp = [];                    //Contains Table definition
    var vcycle = -1;                                //Count cycles 
    var currentFilterString;
    //show or hide script
    function scripttableshow() {
        $('[id^=showscript]').on('click', function () {
            $('#Placeholderscript' + this.id.slice(-1)).hide();
            $('#LoadScript' + this.id.slice(-1)).show();

        });
    };

    function scripttablehide() {
        $('[id^=hidescript]').on('click', function () {
            $('#LoadScript' + this.id.slice(-1)).hide();
            $('#Placeholderscript' + this.id.slice(-1)).show();

        });
    };

    // function buildFilterStatement(filterObjs, selectionObj){
    //     // Only apply filters for the table in question
    //     var filterCount = 0
    //     currentFilterString = ""

    //     for(filterIndex in filterObjs){
    //         if (filterObjs[filterIndex].table == selectionObj.currentTables[0]){
    //             if (filterCount === 0){
    //                 //Start WHERE CLAUSE
    //                 currentFilterString = 'WHERE ';
    //                 currentFilterString += filterObjs[filterIndex].column + " " + filterObjs[filterIndex].relationship.trim(); 
    //                 if (isNaN(filterObjs[filterIndex].textValue)){
    //                     // String entered by user in text box
    //                     currentFilterString += " '" + filterObjs[filterIndex].textValue.trim() + "' ";
    //                 }
    //                 else{
    //                     // Number entered by user in text box
    //                     currentFilterString += " " + filterObjs[filterIndex].textValue.trim();                            
    //                 }
    //                 console.log(currentFilterString);
    //             } 
    //             else {
    //                 // continue building on the where clause 
    //                 currentFilterString += " " + filterObjs[filterIndex].operator.trim() + " " + filterObjs[filterIndex].column.trim() + " " + filterObjs[filterIndex].relationship.trim();
    //                 if (isNaN(filterObjs[filterIndex].textValue)){                            
    //                     currentFilterString +=  " '" + filterObjs[filterIndex].textValue.trim() + "' ";
    //                 }
    //                 else{
    //                     currentFilterString +=  " " + filterObjs[filterIndex].textValue.trim() + " ";
    //                 }
    //                 console.log(currentFilterString);
    //             };
    //             filterCount++;
    //         }
    //     }
    //     return(currentFilterString)
    // };

    function createScriptObjs(qlikGenericObj, app) {

        vScriptArray.push(qlikGenericObj.LoadDD);

        vSelectedTableProp.push([
            vcycle, {
                'SCHEMA': qlikGenericObj.Schema,
                'TABLE': qlikGenericObj.Table,
                'COLUMN': qlikGenericObj.Column,
                'DIMENSION': qlikGenericObj.Dimension,
                'MEASURE': qlikGenericObj.Measure
            }
        ]);
        console.log('vScriptArray:');
        console.log(vScriptArray);
        console.log('vcycle:');
        console.log(vcycle);
        console.log('vSelectedTableProp:');
        console.log(vSelectedTableProp);
        vcycle++;

        // Add html for current script section
        var schema = vSelectedTableProp[vSelectedTableProp.length - 1][1].SCHEMA;
        var table = vSelectedTableProp[vSelectedTableProp.length - 1][1].TABLE;
        var column = vSelectedTableProp[vSelectedTableProp.length - 1][1].COLUMN;
        var dim = vSelectedTableProp[vSelectedTableProp.length - 1][1].DIMENSION;
        var mes = vSelectedTableProp[vSelectedTableProp.length - 1][1].MEASURE;
        var script = vScriptArray[vSelectedTableProp.length - 1];

        if (dim != '') {
            $('#Scripttable').append(`
            <table style="table-layout: fixed;"> 
                <tbody> 
                    <tr> 
                        <td class="selcoltable selrowtable"> ${schema} </td> 
                        <td class="selcoltable selrowtable"> ${table} </td> 
                    </tr> 
                </tbody> 
            </table> 
            <table> 
                <tbody> 
                    <tr>
                        <td> 
                            <pre id="LoadScript${vSelectedTableProp.length - 1} "class="scriptcode">${script}
                                <a href="#" id="hidescript${vSelectedTableProp.length - 1}"> 
                                    <span style="float: right;" class="glyphicon glyphicon-minus"></span> 
                                </a> 
                            </pre> 
                        </td>
                    </tr>
                </tbody>
            </table>
        `);

        } else {
            $('#Scripttable').append(`
            <table style="table-layout: fixed;">
                <tbody>
                    <tr>
                        <td class="selcoltable selrowtable">  ${schema} </td>
                        <td class="selcoltable selrowtable">  ${table} </td>
                    </tr>
                </tbody>
            </table>
            <table>
                <tbody>
                    <tr>
                        <td>
                            <pre id="LoadScript${vSelectedTableProp.length - 1}"class="scriptcode">${script}
                                <a href="#" id="hidescript${vSelectedTableProp.length - 1}">
                                    <span style="float: right;" class="glyphicon glyphicon-minus"></span>
                                </a>
                            </pre>
                        </td>
                    </tr>
                </tbody>
            </table>
            `);
        };

        // attach handlers to show and hide script
        scripttableshow();
        scripttablehide();

        // Reset app selections for another addition
        app.clearAll();

        // Reset the current values for next entry
        currentDbs = []
        currentTables = []
        currentCols = []
    };


    return {
        //Create Table in Script Section
        createScript: function (selectionObjs, app, join_sql, dimensionTableArray, metricsArray) {

            for (selectionIndex in selectionObjs) {
                
                // build the filter sections for the script
                //var filterString = buildFilterStatement(filterObjs, selectionObjs[selectionIndex])

                // [products]:
                // Load
                // [product_model] AS [product_model],
                // [product_name] AS [product_name];
                // SQL SELECT 
                // product_model,
                // product_name
                // FROM qlik2go.products
                // ;
 
                
                // Create object with script layout
                var qlikDimToLoad = ""
                var sqlDimToLoad = ""
                var qlikMesToLoad = ""
                var sqlMesToLoad = ""
                var qlikColsToLoad = ""
                var sqlColsToLoad = ""

                for (dimIndex in dimensionTableArray){
                    if(dimensionTableArray[dimIndex][2].qText !== '-') {
                        //qlikDimToLoad += `${dimensionTableArray[dimIndex][1].qText.trim()}.${dimensionTableArray[dimIndex][2].qText.trim()} AS ${dimensionTableArray[dimIndex][0].qText.trim()},
                        qlikDimToLoad += `${dimensionTableArray[dimIndex][1].qText.trim()}.${dimensionTableArray[dimIndex][2].qText.trim()},
`
                    }else {
                        //qlikDimToLoad += `${dimensionTableArray[dimIndex][1].qText.trim()}.${dimensionTableArray[dimIndex][0].qText.trim()} AS ${dimensionTableArray[dimIndex][0].qText.trim()},
                        qlikDimToLoad += `${dimensionTableArray[dimIndex][1].qText.trim()}.${dimensionTableArray[dimIndex][0].qText.trim()},
`
                    }
                    sqlDimToLoad += `${dimensionTableArray[dimIndex][1].qText.trim()},
`
                }

                for (mesIndex in metricsArray){
                    qlikMesToLoad += `${metricsArray[mesIndex][0].qText.trim()},
`
                    sqlMesToLoad += `${metricsArray[mesIndex][0].qText.trim()},
`
                }
                // Replace the final comma and space with a semicolon for qlik and remove final comma for SQL
                qlikDimToLoad = qlikDimToLoad.slice(0, -2)
                //qlikDimToLoad += ';'
                sqlDimToLoad = sqlDimToLoad.slice(0, -2)

                qlikMesToLoad = qlikMesToLoad.slice(0, -2)
                //qlikMesToLoad += ';'
                sqlMesToLoad = sqlMesToLoad.slice(0, -2)

                var qlikGenericObj = {
                    // Load: 
                    // `[${selectionObjs[selectionIndex].currentTables[0]}]:
                    //     Load
                    //     ${qlikColsToLoad}
                    //     SQL SELECT 
                    //     ${sqlColsToLoad}
                    //     FROM ${selectionObjs[selectionIndex].currentDbs[0]}.${selectionObjs[selectionIndex].currentTables[0]}
                    //     ${filterString};`,
                    LoadDD: 
                    `[${selectionObjs[selectionIndex].currentTables[0]}]:
                        DIRECT QUERY
                        DIMENSION
                        ${qlikDimToLoad}
                        MEASURE 
                        ${qlikMesToLoad}
                        ${join_sql};`,
                    Schema: selectionObjs[selectionIndex].currentDbs.join(),
                    Table: selectionObjs[selectionIndex].currentTables.join(),
                    Measure: selectionObjs[selectionIndex].currentDim.join(),
                    Dimension: selectionObjs[selectionIndex].currentMes.join()
                }
                // app.createGenericObject({
                //     Load: {
                //         qStringExpression: "=$(vLoadComplete)"
                //     },
                //     LoadDD: {
                //         qStringExpression: "=$(vLoadDD)"
                //     },
                //     Schema: {
                //         qStringExpression: "=concat(if(GetFieldSelections([db_name])<> null(),GetFieldSelections([db_name]),''),',')"
                //     },
                //     Table: {
                //         qStringExpression: "=concat(if(GetFieldSelections([table_name])<> null(),GetFieldSelections([table_name]),''),',')"
                //     },
                //     Column: {
                //         qStringExpression: "=concat( distinct [Column],', ')"
                //     },
                //     Measure: {
                //         qStringExpression: "=concat(if(GetFieldSelections(MEASURE_NAME)<> null(),GetFieldSelections(MEASURE_NAME),''),',')"
                //     },
                //     Dimension: {
                //         qStringExpression: "=concat(DIMENSION_NAME,', ')"
                //     }
                // }, function(qlikGenericObject){
                createScriptObjs(qlikGenericObj, app)
                // });
            }
        },
        removeScriptEntry: function(rowId){

            // Remove the latest addition
            vScriptArray = vScriptArray.splice(vScriptArray.length - 1)
            // One less script present now
            vcycle = vcycle - 1
            vSelectedTableProp.splice(rowId, 1)
            // Update the vcycle value in each object
            for (index in vSelectedTableProp.slice(rowId + 1)) {
                vSelectedTableProp[index][0] = vSelectedTableProp[index][0] - 1;
            }
            return [vScriptArray, vcycle, vSelectedTableProp]
        },
        generateTreeObj: function(){
            return [vSelectedTableProp]
        },
        createFinalScript: function(finalScript, vDataConnection){
            //Create final Script
            finalScript += vDataConnection + '\n\n';
            for (var i = 0; i < vScriptArray.length; i++) {
                var table = vSelectedTableProp[i][1].TABLE;
                finalScript += '///$tab "' + table + '"\r\n';
                finalScript += vScriptArray[i];
                finalScript += '\n\n';
            };

            finalScript += 'disconnect;';
            console.log(finalScript);
            return finalScript
        }
    }
})