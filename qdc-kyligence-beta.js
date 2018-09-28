//  ------------------------------------------------------------------------------------- //
var content;
var applicationid;
var applicationfolder;
var vsiteurl;
var vNamespace;

//push config to content
$.ajax({
    url: "./json/qdc_config.json", type: "GET", dataType: "json",
    success: function (data) {
        ;
        content = data;
        applicationid = content.config.cloudera.appid;
        applicationfolder = content.config.general.folder;
        vsiteurl = content.config.general.connect;
        vNamespace = content.config.cloudera.namespace;
    }, error: function (jqXHR, textStatus, errorThrown) {
        console.log(textStatus, errorThrown);
    }
}).then(function () {
    //  ------------------------------------------------------------------------------------- //

    var rootPath = window.location.hostname;
    var portUrl = "81";

    if (window.location.port == "") {
        if ("https:" == window.location.protocol)
            portUrl = "443";
        else {
            portUrl = "81";
        }
    }
    else
        portUrl = window.location.port;

    var pathRoot = "//localhost:4848/extensions/";
    if (portUrl != "4848")
        pathRoot = "//" + rootPath + ":" + portUrl + "/resources/";

    var config = {
        host: window.location.hostname,
        prefix: "/",
        port: window.location.port,
        isSecure: window.location.protocol === "https:"
    };

    require.config({
        baseUrl: (config.isSecure ? "https://" : "http://") + config.host + (config.port ? ":" + config.port : "") + config.prefix + "resources",
        paths: { app: (config.isSecure ? "https://" : "http://") + config.host + (config.port ? ":" + config.port : "") }
    });

    require([
        "js/qlik",
        "jquery",
        applicationfolder + "/js/bootstrap.min",
        applicationfolder + "/js/bootstrap-select",
        applicationfolder + "/js/bootstrap-notify.min",
        applicationfolder + "/js/jquery.cookie",
        applicationfolder + "/js/bootstrap-switch.min",
        applicationfolder + "/js/tree-beta",
        applicationfolder + "/js/filters",
        applicationfolder + "/js/selections",
        applicationfolder + "/js/script"
    ],
        function (qlik, $, a, selectpicker, b, c, d, e, filters, selections, script) {
            //Variables
            var vDataConnection = '';                       //Contains Data Connection string
            var dataConnectionTransfer = '';              //Contains Name of Data Connection
            var finalScript = '';                          //Contains final script to push into app
            var reloaded = null;                            //Reloadstatus
            var gettypeobject = '';                         //Holds GenericObject for Type
            var directDiscoveryCheck = 'off';                           //Direct Discovery Check
            var vLimit = 0;                                 //Containts Value for Limit
            var thousandSeperator = ','                    //Sign to format thounsands

            var newFilterRowNum = 2; // first value is hard coded for now
            var vSessionObject;     //holding SessionObject
            var newFilterRow = '';
            var filterPresent = 0;   // flag for if filter present

            // IDs
            var databaseFilterId = 'UVKGQX';            
            var tableFilterId = 'pnbM';
            var columnFilterId = 'eeGjFtQ';
            var measureFilterId = 'fDSmB';
            var tagFilterId = 'EaevuCA';

            var joinTableId = 'raxmN';            
	        var joinPrimaryKeyId = 'hkXuXWP';            
	        var joinForeignKeyId = 'WzhQcK';            
	        var joinTypeId = 'psnh';            
            var factTableFilterId = 'abTYSWd';
            var dimensionTableId = 'XRrcs';
            var measureTableId = 'uRdSQa';
            var metricsTableId = 'vLLpSGq';

            // record user selections
            var currentDbs = []
            var currentTables = []
            var currentDim = []
            var currentMes = []
            var selectionObjs = []
            var join_sql = ""
            var dimensionTableArray = []
            var measureTableArray = []
            var selectedMeasure = []
            var metricsArray = []
            // Current selections
            var summaryTableCols = []
            var detailTableCols = []
            var selectedTable = []
            // Filter Variables

            var sourceFieldOptions = "";      //containing database and table options for the filter dropdown
            var colFieldOptions = "";        // containing column options for the filter dropdown
            // APP UI functions

            var addTableButtonClicked = false;

            function AppUi(app) {
                var me = this;
                this.app = app;
                app.global.isPersonalMode(function (reply) {
                    me.isPersonalMode = reply.qReturn;
                });
                // Update Bookmark List
                app.getList("BookmarkList", function (reply) {
                    var str = "";
                    reply.qBookmarkList.qItems.forEach(function (value) {
                        if (value.qData.title) {
                            str += '<li><a class="linkstyle bookmark-item" href="#" data-id="' + value.qInfo.qId + '">' + value.qData.title + '</a></li>';
                        }
                    });
                    str += '<li role="separator" class="divider"></li><li><a href="#" data-cmd="create"><b>Create Bookmark</b></a></li>';
                    $('#qbmlist').html(str).find('a').on('click', function () {
                        var id = $(this).data('id');
                        if (id) {
                            app.bookmark.apply(id);
                        } else {
                            var cmd = $(this).data('cmd');
                            if (cmd === "create") {
                                $('#createBmModal').modal();
                            }
                        }
                    });
                });
            }

            $("[data-qcmd]").on('click', function () {
                // Create Bookmark
                var $element = $(this);
                switch ($element.data('qcmd')) {
                    //app level commands
                    case 'createBm':
                        var title = $("#bmtitle").val(), desc = $("#bmdesc").val();
                        app.bookmark.create(title, desc);
                        $('#createBmModal').modal('hide');
                        break;
                }
            });

            // Update Bookmark selection
            $("body").on("click", ".bookmark-item", function () {
                var element = $(this)
                $('#bookmark-btn').html($(this).text() + ' <span class="caret"></span>')
                console.log(element)
            })

            //Bootstrap Switch
            $('input[name="DDCheck"]').bootstrapSwitch();

            //App Object Connection
            var app = qlik.openApp(applicationid, config);
            app.clearAll();

            //get objects -- inserted here --
            app.getObject('CurrentSelections', 'CurrentSelections');
            // first three are database, table and column filter panes
            app.getObject('QV01', databaseFilterId);
            app.getObject('QV02', tableFilterId);
            app.getObject('QV03', columnFilterId);
            app.getObject('QV04', measureFilterId );
            app.getObject('QV05', 'bdjLf');
            app.getObject('QV06', 'ybWmTHe');
            app.getObject('QV07', 'qBZDR');
            app.variable.setStringValue('vLimit', '0');

            //UI Functions for progress
            $("#seldatacon").on('click', function () {
                $('#myTab a[href="#Datacon"]').tab('show');
                $('.progress-bar').css('width', '0%');
            });

            $("#seltable").on('click', function () {
                $('#myTab a[href="#Table"]').tab('show');
                $('.progress-bar').css('width', '35%');
            });

            $("#reloaddata").on('click', function () {
                $('#myTab a[href="#Reload"]').tab('show');
                $('.progress-bar').css('width', '100%');
            });

            //Get DataConnections @ start
            $(document).ready(function () {
                var vConnection = [];
                var scope = $('body').scope();
                scope.enigma = null;
                console.log("app.global.session", app.global.session);

                scope.$watch(function () { return app.global.session.__enigmaApp }, function (newValue, oldValue) {
                    if (newValue) {
                        scope.enigma = newValue;
                        console.log("bound Enigma", scope.enigma);

                        scope.enigma.getConnections().then(function (connection) {
                            $.each(connection, function () {
                                vConnection.push(this.qName);
                                $('#dataconnection').append('<option class="data-connection-entry">' + this.qName + '</option>');
                            });
                            $('.selectpickerdatacon').selectpicker({
                                style: 'btn-primary',
                                size: 10,
                            });
                            // scope.enigma.session.close();
                        });
                    }
                });
            });

            // ********** Start of handlers for section 1 (Data Connection) **********

            $('#PickDataCon').on('click', function () {
                $('#myTab a[href="#Table"]').tab('show');
                $('.progress-bar').css('width', '35%');
                var vTimeout5 = setTimeout(myTimer5, 100);
                function myTimer5() {
                    qlik.resize();
                };
            });

            //Pick Data Connection
            $('#dataconnection').on('changed.bs.select', function (e) {
                console.log($('#dataconnection').val());
                dataConnectionTransfer = $('#dataconnection').val();

                vDataConnection = "LIB CONNECT TO '" + dataConnectionTransfer + "';";
            });

            //Activate Button "Apply Data Connection"
            $('#dataconnection').on('changed.bs.select', function () {
                $('#PickDataCon').removeClass('disabled');
                //$('#PickDataCon').addClass('active');
                $('#PickDataCon').prop('disabled', false);
            });

            // ********** Start of handlers for section 2 (Table) **********

            // Direct Discovery Handlers
            //DDCheck Switch
            $('input[name="DDCheck"]').on('switchChange.bootstrapSwitch', function (event, state) {
                if (state == true) {
                    directDiscoveryCheck = 'on';
                    $('#Limit').hide();
                    console.log('switched to on');
                } else {
                    directDiscoveryCheck = 'off';
                    $('#Limit').show();
                    console.log('switched to off');
                }
            });

            // Selection Bar



            // Filter Handlers
            //show hide Filterbody
            $('#createFilterSection').on('click', function () {
                // at least one table is present
                if (selectionObjs.length != 0) {
                    if ($('#Filterbody').css('display') === 'none') {
                        // Filter structure created on add table button press as it gets up
                        filterPresent = 1;
                        colFieldOptions = filters.initialColOptions(selectionObjs)                        
                        //filters.updateFilterSourceOptions(selectionObjs, sourceFieldOptions);
                        //$('.selectpicker').selectpicker();
                        $('#Filterbody').show();
                    }
                }
                else {
                    // TODO: Add warning to ask the user to enter a database, table and columns
                    console.log('Add warning to ask the user to enter a database, table and columns')
                }
            });

            $('#closeFilterbody').on('click', function () {
                $('#Filterbody').hide();
                //$(".filter-source-fields").html("");
                //$(".filter-col-fields").html("");
                $("#filter-row-1").siblings().remove();
                newFilterRow = '';
                sourceFieldOptions = '';
                colFieldOptions = '';

            });

            //Add another Filteroption

            $("body").on('click', '#addFilter', function () {
                newFilterRow = filters.addFilterRow(newFilterRowNum, sourceFieldOptions, colFieldOptions)
                var lastAddedFilter = $('#filterTable tr:last')
                if(newFilterRowNum > 1){
                    $(newFilterRow).insertAfter($('#filterTable tr:last'));
                }
                else{
                    $("#filterTable tbody").append(newFilterRow);
                }
                $('.selectpicker').selectpicker();
                newFilterRowNum++;
                console.log($('#Filterbody tr').length);
                //update operators in other filter rows
                filters.updateAllOperators()
            });

            $("body").on("click", ".remove-filter", function () {
                // Get the row to remove
                console.log($(this))
                let rowIndexID = $(this).attr('id');
                // Strip the row number from the id
                let rowIndex = rowIndexID.slice(rowIndexID.length - 1);
                // Remove element from DOM
                $("#filter-row-" + rowIndex).remove()
                newFilterRowNum--;

            });

            //Remove a Filter option
            $("body").on('click', '.Filter_add_right', function () {
                $('#' + $(this).closest("tr").attr('id')).remove();
                //Count # rows
                console.log($('#Filterbody tr').length);
            });

            $("#show-tags").on('click', function(){
                $("#tags").toggle();
                app.getObject('QV08', tagFilterId);                        
            });

            //Selections Bar
            $("#selection-bar-button").on('click', function(){
                $("#selection-bar").toggle();
                app.getObject('selection-bar', 'CurrentSelections');
                document.body.scrollTop = 0; // For Safari
                document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
            })

            $("body").on('click', ".qv-subtoolbar-button", function(){
                console.log("Hello")
            })

            // Limit Handlers
            $('#Limit').on('click', function () {
                // show modal to set limit value
                $('#modalLimit').modal();
            });

            $('#applyLimit').on('click', function () {
                vLimit = ($('#valueLimit').val());
                app.variable.setStringValue('vLimit', $('#valueLimit').val());
                $('#modalLimit').modal('toggle');
                $('#Limit').removeClass('btn-default');
                $('#Limit').addClass('btn-success');
                $('#RowAmount').empty();
                $('#RowAmount').append(formatNumber(vLimit));
            });

            //Table and Column details for showing number of rows and distinct values
            $('#details1, #details2').on('click', function () {
                $('#modalDetails').modal();
                qlik.resize();
            })

            //Amount Information for Selection
            app.createGenericObject({
                DBAmount: {
                    qStringExpression: "=$(vDBAmount)"
                },
                TableAmount: {
                    qStringExpression: "=$(vTBAmount)"
                },
                ColAmount: {
                    qStringExpression: "=$(vColAmount)"
                },
                RowAmount: {
                    qStringExpression: "=$(vRowAmount)"
                }
            }, function (data) {
                $('#DBAmount').empty();
                $('#DBAmount').append(formatNumber(data.DBAmount));
                $('#TableAmount').empty();
                $('#TableAmount').append(formatNumber(data.TableAmount));
                $('#ColAmount').empty();
                $('#ColAmount').append(formatNumber(data.ColAmount));
                if (vLimit != 0) {
                    $('#RowAmount').append(formatNumber(vLimit));
                } else {
                    //if (data.RowAmount === '0') {
                        //$('#RowAmount').text("Number of Rows: ");
                    //} else {
                        $('#RowAmount').text("No. Rows: " + formatNumber(data.RowAmount));
                    //}
                }
            });

            //Selection Logic

            // if qlik selection popover is clicked on
            $("body").on("click", ".lui-popover-container", function () {
                //console.log(this.parent());
                app.getList('SelectionObject', function (selectionObj) {
                    console.log('should now have selection obj')
                    var currentSelections = selections.updateCurrentSelections(selectionObj, currentDbs, currentTables, currentDim, currentMes)
                    currentDbs = currentSelections[0]
                    currentTables = currentSelections[1]
                    currentDim = currentSelections[2]
		            currentMes = currentSelections[3]
                });
            })

            $("body").on("click", ".filter-source-fields", function () {   
                // populate the filter dropdown with the columns for the source the user selected
                colFieldOptions = filters.updateFilterColOptions(selectionObjs, $(this))
                // only show operator if it is not the first occurance of the filter
                filters.updateAllOperators()
            });

            // Select all possible matches
            $('#add-all-possible-btn').on('click', function () {
                //filterPane = app.getObject('QV03', 'UyxsShT');    
                app.field('Column').selectPossible();
            });

            // Remove DB selections
            $('#remove-selections-dbs').on('click', function () {
                app.field('project').clear();
            });

            // Remove table selections
            $('#remove-selections-tables').on('click', function () {
                app.field('cube_name').clear();
            });

        //    // Popup Database/Table Row Count
             $('#modalbutton0').on('click', function (event) {
             //insert modal popup
                 console.log('duh');
                 app.getObject('test','PFVjYuV')
                 });
                 
                 
        //    // Popup Table / Columns Distinct
             $('#modalbutton1').on('click', function (event) {
                //insert modal popup
                  console.log('duh');
                 app.getObject('test','QjxaQZ')
                }); 

            // Remove column selections
            $('#remove-selections-cols').on('click', function () {
                app.field('Column').clear();
            });

            // Remove column selections
            $('#remove-selections-tags').on('click', function () {
                app.field('metadata_tag').clear();
            });


            $('body').on('click', ".remove-row", function () {
                let parentId = $(this).parent().get(0).id
                rowId = parseInt(parentId.substr(parentId.length - 1));            
                selections.removeSelectionRow(rowId, selectionObjs)
                script.removeScriptEntry(rowId)
            })

            //var supportedMeasure = ["SUM", "COUNT", "COUNT_DISTINCT", "MAX", "MIN"]
            var kylinMeasureHandler = function (measureObj) {
                var measureDescArray = [];
                var expression = '',
                    paramValue = '',
                    measureName = '',
                    newExpression = '';

                for(var i=0; i<measureObj.length; i++){
                    expression = measureObj[i][1].qText;
                    paramValue = measureObj[i][2].qText;
                    measureName = measureObj[i][0].qText;

                    selectedMeasure = selectedMeasure.map(x=>x.trim());
                    // if(selectedMeasure.indexOf(measureName) == -1) {
                    //     continue;
                    // }
                    switch (expression) {
                        case "SUM": 
                            newExpression = `=SUM(${paramValue})`
                            break;
                        case "COUNT": 
                            newExpression = `=COUNT(${paramValue})`
                            break;   
                        case "COUNT_DISTINCT": 
                            newExpression = `=Count(DISTINCT ${paramValue})`
                            break;   
                        case "MAX": 
                            newExpression = `=MAX(${paramValue})`
                            break;  
                        case "MIN": 
                            newExpression = `=MIN(${paramValue})`
                            break;  
                        // case "TOP_N": 
                        //     newExpression = `TOP ${returnParamValue} (${paramValue})`
                        //     break;      
                        // case "PERCENTILE_APPROX": 
                        //     newExpression = `PERCENTILE(${paramValue})`
                        //     break;     
    
                    }
    
                    measureDescArray.push({      
                        "qInfo": {
                            "qId": measureName,
                            "qType": "measure"
                        },
                        "qMeasure": {
                            "qLabel": measureName,
                            "qDef": newExpression
                        },
                        "qMetaDef": {
                            "title": measureName
                          }
                    })
                }
                
                return measureDescArray;
            }

            // Create Objects to store scripts
            $('#AddScriptEntry').on('click', function () {
                console.log('Adding script entry...')
                console.log(directDiscoveryCheck);
                addTableButtonClicked = true;
                //Check DDListbox
                
                // May say 20 of 2048 etc. 
                // Need to get actual names if this happens
                //currentCols = selections.checkColumnNamesExist(currentCols, app)
                app.createGenericObject({
                    dimsConcat: {
                        qStringExpression: "=$(vDimConcat)"
                    },
                    mesConcat: {
                        qStringExpression: "=$(vMesConcat)"
                    },                    
                }, function(colsConcatObj){
                    if(addTableButtonClicked){
                        if(currentDim.length == 1 && currentDim[0].includes("of")){                        
                            var dimsArray = colsConcatObj.dimsConcat.split("|")
                            //var currentSelections = selections.updateCurrentSelections(selectionObjs, currentDbs, currentTables, currentDim, currentMes)
                            currentDim = dimsArray.slice(0, dimsArray.length - 1)
                        }

                        if(currentMes.length == 1 && currentMes[0].includes("of")){                        
                            var mesArray = colsConcatObj.mesConcat.split("|")
                            //var currentSelections = selections.updateCurrentSelections(selectionObjs, currentDbs, currentTables, currentDim, currentMes)
                            currentMes = mesArray.slice(0, mesArray.length - 1)
                        }

                        selectedMeasure = currentMes;

                        // Don't add unless selection is correctly defined
                        if (currentDbs.length != 0 && currentTables != 0) {
                            // Store selections for later
                            selectionObjs.push({
                                currentDbs: currentDbs,
                                currentTables: currentTables,
                                currentDim: currentDim,
				                currentMes: currentMes
                            })

                            // Add the latest selecctions to the dom
                            selections.recreateSelectionRows(selectionObjs)

                            // Update Filter Selction Options to Inlcude new selections
                            sourceFieldOptions = filters.updateFilterSourceOptions(selectionObjs, sourceFieldOptions)
                        
                        }
                        // Either the database, table or column selection is empty
                        else {
                            // TODO: Need to add warning that selection must be made
                            console.log("Need to add warning that selection must be made")
                        }
                    }
                    addTableButtonClicked = false
                });

                var fetchParam = [{                    
                    qTop: 0,                     
                    qLeft: 0,                     
                    qWidth: 10,                     
                    qHeight: 1000                  
                }]

                // fetch the factTableName array
                var factTableName = ''
                var promise0 = new Promise(function(resolve, reject) {
                    app.getObject(factTableFilterId).then(model => {                                                                                        
                        model.getHyperCubeData('/qHyperCubeDef', fetchParam).then((data) => {
                            factTableName = data[0].qMatrix[0][5].qText;
                            resolve()
                        })                
                    });
                });
            
                // fetch the joinTable array
                var tableJoinArray = []    
                var promise1 = new Promise(function(resolve, reject) {
                    app.getObject(joinTableId).then(model => {                                                                                      
                        model.getHyperCubeData('/qHyperCubeDef', fetchParam).then((data) => {
                            tableJoinArray = data[0].qMatrix;
                            resolve()
                        })                
                    });
                });
               
                // fetch the joinType array
                var typeJoinArray = []
                var promise2 = new Promise(function(resolve, reject) {
                    app.getObject(joinTypeId).then(model => {                                 
                        model.getHyperCubeData('/qHyperCubeDef', fetchParam).then((data) => {
                            typeJoinArray = data[0].qMatrix;
                            resolve()
                        })
                    })                  
                });
               
                // fetch the primaryKey array
                var primaryKeyJoinArray = []
                var promise3 = new Promise(function(resolve, reject) {
                    app.getObject(joinPrimaryKeyId).then(model => {                                 
                        model.getHyperCubeData('/qHyperCubeDef', fetchParam).then((data) => {
                            primaryKeyJoinArray = data[0].qMatrix;
                            resolve()
                            console.log(primaryKeyJoinArray)
                        })  
                    })              
                });
           
                // fetch the foreignKey array
                var foreignKeyJoinArray = []
                var promise4 = new Promise(function(resolve, reject) {
                    app.getObject(joinForeignKeyId).then(model => {                                  
                        model.getHyperCubeData('/qHyperCubeDef', fetchParam).then((data) => {
                            foreignKeyJoinArray = data[0].qMatrix;
                            resolve()
                        })  
                    })              
                });

                // fetch the dimensionTable array
                var promise5 = new Promise(function(resolve, reject) {
                    app.getObject(dimensionTableId).then(model => {                                
                        model.getHyperCubeData('/qHyperCubeDef', fetchParam).then((data) => {
                            dimensionTableArray = data[0].qMatrix;
                            resolve()
                        })  
                    })              
                });

                // fetch the measureTable array
                var promise6 = new Promise(function(resolve, reject) {
                    app.getObject(measureTableId).then(model => {                                  
                        model.getHyperCubeData('/qHyperCubeDef', fetchParam).then((data) => {
                            measureTableArray = kylinMeasureHandler(data[0].qMatrix)
                            resolve()
                        })  
                    })              
                });

                // fetch the metrics array
                var promise7 = new Promise(function(resolve, reject) {
                    app.getObject(metricsTableId).then(model => {                                 
                        model.getHyperCubeData('/qHyperCubeDef', fetchParam).then((data) => {
                            metricsArray = data[0].qMatrix
                            resolve()
                        })  
                    })              
                });

                Promise.all([promise0, promise1, promise2, promise3, promise4, promise5, promise6, promise7]).then(function() {
                    
                    var joinKey = '';
                    var table_verbose_name = '';
                    var table_origin_name = '';
                    var sql_join_table_part = '';
                    var sql_join_key_part = '';
                    var primaryKey = '';
                    var foreignKey = '';
                    var primaryKey_Length = 0,
                        tableKey_length = 0;

                    join_sql = `FROM ${factTableName}` + '\n';
                    if(typeJoinArray.length !== 0 && primaryKeyJoinArray.length !== 0) {
                        for (let i = 0; i < typeJoinArray.length; i++) {
                            joinKey = typeJoinArray[i][0].qText;

                            // join table clause part
                            tableKey_length = tableJoinArray.length;
                            for (let q=0; q < tableKey_length; q++) {
                                if(tableJoinArray[q][2].qText == joinKey) {
                                    // direct query do not support join as
                                    sql_join_table_part = ` ${typeJoinArray[q][2].qText} JOIN  ${tableJoinArray[q][1].qText}` + '\n';
                                    table_verbose_name = tableJoinArray[q][0].qText;
                                    table_origin_name = tableJoinArray[q][1].qText;
                                }
                            }

                            // join primaryKey and foreignKey clause part
                            primaryKey_Length = primaryKeyJoinArray.length
                            sql_join_key_part = ''
                            for (let j = 0; j < primaryKey_Length; j++){
                                // add primaryKey
                                if(primaryKeyJoinArray[j][0].qText == joinKey){

                                    //replace table verbose name with origin name (no join as)
                                    var re = new RegExp(table_verbose_name, "g");
                                    primaryKey = primaryKeyJoinArray[j][1].qText.replace(re, table_origin_name)

                                    if (sql_join_key_part.length !== 0) {
                                        sql_join_key_part = sql_join_key_part.slice(0, -2);
                                        sql_join_key_part += ` AND ${primaryKey}`;
                                    }else{
                                        sql_join_key_part = ` ON (${primaryKey}`;
                                    }
                                }
                                // add foreignKey
                                if(foreignKeyJoinArray[j][0].qText == joinKey){
                                    foreignKey = foreignKeyJoinArray[j][1].qText.replace(re, table_origin_name)
                                    sql_join_key_part += ' = '  + foreignKey + ')\n'
                                }
                            }
                            join_sql = join_sql + sql_join_table_part + sql_join_key_part;
                        }
                    }

                    //clear app data after all promises resolved
                    currentDbs = []
                    currentTables = []
                    currentDim = []
                    currentMes = []
                    app.clearAll();
                })
            });

            // Start of handlers for section 3 (Script)

            $('#CreateScript').on('click', function () {
                $('#myTab a[href="#Script"]').tab('show');
                $('.progress-bar').css('width', '65%');
                script.createScript(selectionObjs, app, join_sql, dimensionTableArray, metricsArray);
            });


            // Allow user to add additional tables
            $('.changeSelections').on('click', function () {

                // Remove the script so that it can be appended next time
                $('#Scripttable').empty()

                // Move progress back a step
                $('#myTab a[href="#Table"]').tab('show');
                $('.progress-bar').css('width', '35%');
                var vTimeout5 = setTimeout(myTimer5, 100);
                function myTimer5() {
                    qlik.resize();
                };

                // Reset limit
                // $('#Limit').show();
                // $('#Limit').removeClass('btn-success');
                // $('#Limit').addClass('btn-default');
            });

            //Apply selected Tables
            $('#applyseltables').on('click', function () {

                // Empty summary table
                $('#infodatacon').empty();
                $('#infodatasource').empty();
                $('#infotables').empty();
                $('#infoc').empty();
                summaryTableCols = [];

                // Increase progress bar
                $('#myTab a[href="#Reload"]').tab('show');
                $('.progress-bar').css('width', '100%');

                // Hide KPIs
                $('#KPI1').hide()
                $('#KPI2').hide()
                $('#KPI3').hide()
                $('#KPI4').hide()
                
                finalScript = script.createFinalScript(finalScript, vDataConnection)
                //Display Overview

                // Loop through selections backwards to populate tree
                var columnListString = "";
                
                var treeObj = script.generateTreeObj()
                var vSelectedTableProp = treeObj[0]
                // var columnsArray = treeObj[1]
                // var avmes = treeObj[2]
                // var avdim = treeObj[3]

                for (var i = vSelectedTableProp.length - 1; i >= 0; i--) {
                    // ConumberStringuct html list of columns
                    // $.each(columnsArray, function (index, value) {
                    //     columnListString += `<li class="tree-leaf">${value}</li>`;
                    // });
                    // console.log('columnListString: ' + columnListString)

                    //Append content to table
                    $('#tree-root').after(`
                        <ul class="nav nav-list tree bullets">
                            <li>
                                <label id="infodatasource-${i}" class="tree-toggle nav-header infodatasource">
                                    ${vSelectedTableProp[i][1].SCHEMA}
                                </label>
                                <ul class="nav nav-list tree">
                                    <li>
                                        <label id="infotable-${i}" class="nav-header infotable tree-table">
                                            ${vSelectedTableProp[i][1].TABLE}
                                        </label>
                                    </li>
                                </ul>
                            </li>
                        </ul>
                    `)

                    // Old version with columns
                //     $('#tree-root').after(`
                //     <ul class="nav nav-list tree bullets">
                //         <li>
                //             <label id="infodatasource-${i}" class="tree-toggle nav-header infodatasource">
                //                 ${vSelectedTableProp[i][1].SCHEMA}
                //             </label>
                //             <ul class="nav nav-list tree">
                //                 <li>
                //                     <label id="infotable-${i}" class="nav-header infotable tree-table">
                //                         ${vSelectedTableProp[i][1].TABLE}
                //                     </label>
                //                     <ul class="nav nav-list tree column-list">
                //                         ${columnListString}
                //                     </ul>
                //                 </li>
                //             </ul>
                //         </li>
                //     </ul>
                // `)
                }


                $('#infodatacon').append(dataConnectionTransfer);

                $("body").on("click", ".tree-toggle", function () {
                    console.log('Toggling Tree...')
                    $(this).parent().children('ul.tree').toggle(200);
                });

                summaryTableCols.push('project')
                summaryTableCols.push('cube_name')
                summaryTableCols.push('cube_status')
                summaryTableCols.push('owner')

                tableList = []
                for(selectionIndex in selectionObjs){
                    tableList = tableList.concat(selectionObjs[selectionIndex].currentTables)
                }

                app.clearAll().then(function(){
                    app.field('cube_name').selectValues(tableList).then(function(){
                        app.visualization.create('table', summaryTableCols).then(function (chart) {
                            // parameter is the id of html element to show in
                            chart.show('QVINFO');
                            qlik.resize();
                        });  
                    });
                });

                $('.tree-table').on('click', function (element) {
                    // uncheck sibling elements that are selected
                    $(".tree-table").not(this).each(function(){
                        if ($(this).hasClass('active-tree-table')) {
                            // item already selected so unselect and remove
                            $(this).removeClass('active-tree-table')
                        }
                    })

                    $(this).removeClass('active-tree-table')

                    $('#KPI1').hide()    
                    $('#KPI2').hide()                                    
                    $('#KPI3').hide()                                    
                    $('#KPI4').hide()  

                    $("#summary-title").text("Table Summary")

                    //show summary table again
                    app.clearAll().then(function(){
                        app.field('cube_name').selectValues(tableList).then(function(){
                            app.visualization.create('table', summaryTableCols).then(function (chart) {
                                // parameter is the id of html element to show in
                                chart.show('QVINFO');
                                qlik.resize();
                            });
                        });
                    });
                });

            });

            //Create App
            $('#createapp').on('click', function () {
                var vApp = "";
                var vAppID = "";
                var vTimestamp = timeStamp();
                var notify = "";
                var new_app = null;

                var global = qlik.getGlobal(config);
                var scope = $('body').scope();
                scope.enigma = null;
                console.log("global.session", global.session);
                //console.log('global',global);

                scope.$watch(function () { return global.session.__enigmaApp }, function (newValue, oldValue) {

                    if (newValue) {
                        $.notify({ icon: 'glyphicon glyphicon-ok', message: 'Connection to Qlik Sense Server establised.' }, { type: 'success', placement: { from: 'bottom', align: 'right' } });
                        scope.enigma = newValue;
                        console.log("bound Enigma", scope.enigma);
                        vApp = vNamespace + '_' + vTimestamp;
                        scope.enigma.createApp(vNamespace + '_' + vTimestamp).then(function (newApp) {
                            $.notify({ icon: 'glyphicon glyphicon-ok', message: 'APP: <b>' + vApp + '</b> created successfully. ID: ' + '<b>' + newApp.qAppId + '</b>' }, { type: 'success', placement: { from: 'bottom', align: 'right' } }, { newest_on_top: true });
                            vAppID = newApp.qAppId;
                            //console.log('newApp.qAppId',newApp.qAppId);
                            console.log('newApp', newApp);
                            scope.enigma.openDoc(vAppID).then(function (conns) {
                                console.log('conns', conns);
                                new_app = conns;
                                var localsettings = "";
                                localsettings += "///$tab Main\r\n";
                                localsettings += "SET ThousandSep=',';\n";
                                localsettings += "SET DecimalSep='.';\n";
                                localsettings += "SET MoneyThousandSep=',';\n";
                                localsettings += "SET MoneyDecimalSep='.';\n";
                                localsettings += "SET MoneyFormat='#.##0,00 €;-#.##0,00 €';\n";
                                localsettings += "SET TimeFormat='h:mm:ss';\n";
                                localsettings += "SET DateFormat='YYYY-MM-DD';\n";
                                localsettings += "SET TimestampFormat='YYYY-MM-DD h:mm:ss[.fff]';\n";
                                localsettings += "SET MonthNames='Jan;Feb;Mrz;Apr;Mai;Jun;Jul;Aug;Sep;Okt;Nov;Dez';\n";
                                localsettings += "SET DayNames='Mo;Di;Mi;Do;Fr;Sa;So';\n";
                                localsettings += "SET LongMonthNames='Januar;Februar;März;April;Mai;Juni;Juli;August;September;Oktober;November;Dezember';\n";
                                localsettings += "SET LongDayNames='Montag;Dienstag;Mittwoch;Donnerstag;Freitag;Samstag;Sonntag';\n";
                                localsettings += "SET FirstWeekDay=0;\n";
                                localsettings += "SET BrokenWeeks=0;\n";
                                localsettings += "SET ReferenceDay=4;\n";
                                localsettings += "SET FirstMonthOfYear=1;\n";
                                localsettings += "SET CollationLocale='de-DE';\n";
                                localsettings += '\n';

                                new_app.setScript(localsettings + finalScript)
                                $.notify({ icon: 'glyphicon glyphicon-ok', message: 'LoadScript appended successfully.' }, { type: 'success', placement: { from: 'bottom', align: 'right' } });
                                notify = $.notify({ icon: 'glyphicon glyphicon-refresh glyphicon-refresh-animate', message: 'Indexing application...<br><div id="progress"></div><div id="progressstatus"></div>' }, { type: 'info', timer: '1000000', placement: { from: 'bottom', align: 'right' } });

                                if(measureTableArray.length!==0) {
                                    for(var i=0; i<measureTableArray.length;i++) {
                                        new_app.createMeasure(measureTableArray[i]).then(function(reply) {   
                                            console.log(reply);                                  
                                        }, function(error) {  
                                            console.log("error: " + error.stack);
                                        }); 
                                    }
                                    //$.notify({ icon: 'glyphicon glyphicon-ok', message: 'measure pre-create successfully.' }, { type: 'success', placement: { from: 'bottom', align: 'right' } });
                                }
                                
                                console.log('Reload:');
                                return new_app.doReload();
                            }).then(function () {
                                notify.close();
                                $.notify({ icon: 'glyphicon glyphicon-ok', message: 'Application created successfully.' }, { type: 'success', placement: { from: 'bottom', align: 'right' } })
                                notify = $.notify({ icon: 'glyphicon glyphicon-refresh glyphicon-refresh-animate', message: 'Saving application...' }, { type: 'info', timer: '1000000', placement: { from: 'bottom', align: 'right' } });
                                console.log('Save:');
                                return new_app.doSave();
                            }).then(function (b) {
                                //console.log('b',b);
                                notify.close();
                                $.notify({ icon: 'glyphicon glyphicon-ok', message: 'App saved successfully.' }, { type: 'success', placement: { from: 'bottom', align: 'right' } });
                                var vurl = vsiteurl + vAppID;
                                var vurldataprep = vsiteurl + vAppID + '/datamanager/datamanager';
                                $.notify({ icon: 'glyphicon glyphicon-log-in', message: 'Click to open App', url: vurl }, { type: 'info', timer: '100000000', placement: { from: 'bottom', align: 'right' } });
                                $.notify({ icon: 'glyphicon glyphicon-log-in', message: 'Click to open Data-Prep', url: vurldataprep }, { type: 'info', timer: '100000000', placement: { from: 'bottom', align: 'right' } });
                                //console.log('global',global);
                                //console.log('new_app',new_app);
                                app.close();
                                //return new_app.session.close();
                                scope.enigma.session.close()
                                //global.session.close();
                            }).catch(function (error) {
                                console.error('Error' + error);
                                clearInterval(progress);
                            });

                            reloaded = null;
                            var progress = setInterval(function () {
                                if (reloaded != true) {
                                    // get the progress of the qlik data reload and display
                                    scope.enigma.getProgress(5).then(function (msg) {
                                        if (msg.qPersistentProgress) {
                                            persistentProgress = msg.qPersistentProgress;
                                            var text = msg.qPersistentProgress;
                                            $('#progress').append('<p>' + text + '</p>');
                                        } else {
                                            if (msg.qTransientProgress) {
                                                var text2 = persistentProgress + ' <-- ' + msg.qTransientProgress;
                                                $('#progressstatus').empty();
                                                $('#progressstatus').append('<p>' + text2 + '</p>');
                                            }
                                        }
                                    })
                                } else {
                                    clearInterval(progress)
                                }
                            }, 500);

                        }).catch(function (error) {
                            console.error('Error' + error);
                            clearInterval(progress);
                        });
                    }
                });

            });

            //Building Timestamps (Used to uniquely name app on creation)
            function timeStamp() {
                // Create a date object with the current time
                var now = new Date();

                // Create an array with the current month, day and time
                var date = [now.getMonth() + 1, now.getDate(), now.getFullYear()];

                // Create an array with the current hour, minute and second
                var time = [now.getHours(), now.getMinutes(), now.getSeconds()];

                // Determine AM or PM suffix based on the hour
                var suffix = (time[0] < 12) ? "AM" : "PM";

                // Convert hour from military time
                //time[0] = (time[0] < 12) ? time[0] : time[0] - 12;

                // If hour is 0, set it to 12
                time[0] = time[0] || 12;

                // If seconds and minutes are less than 10, add a zero
                for (var i = 1; i < 3; i++) {
                    if (time[i] < 10) {
                        time[i] = "0" + time[i];
                    }
                }

                // Return the formatted string
                var tmp = date.join() + "_" + time.join();
                return tmp.replace(/,/g, "");
            }

            //Format Numbers
            function formatNumber(numberString) {
                var rgx = /(\d+)(\d{3})/;
                while (rgx.test(numberString)) {
                    // add thousand seperator after every group of three numbers
                    numberString = numberString.replace(rgx, '$1' + thousandSeperator + '$2');
                }
                return numberString;
            }

            //RERUN Button
            $("#rerun").on('click', function () {
                location.reload(true);
            });


            if (app) {
                new AppUi(app);
            }
        });
});
