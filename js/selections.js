/**
 * Logic and html generation for the selection section
 */
define(function () {

    function recreateSelectionRows(selectionObjs) {
        $('.selection-row').remove();
        for (selectionIndex in selectionObjs) {
            selection = selectionObjs[selectionIndex]
            // Populate the next row of entries
            $('#databases-selected').append(`
            <div id='database-div-${selectionIndex}' class='selection-row selections-container-database'>
                <p id='database-${selectionIndex}'>
                <p>
            </div>`)
            for (dbIndex in selection.currentDbs) {
                $('#database-' + selectionIndex).append(selection.currentDbs[dbIndex])
            }
            $('#tables-selected').append(`
            <div id='table-div-${selectionIndex}' class='selection-row selections-container-table'>
                <p id='table-${selectionIndex}'>
                </p>
            </div>`)
            for (tableIndex in selection.currentTables) {
                $('#table-' + selectionIndex).append(selection.currentTables[tableIndex])
            }
            $('#columns-selected').append(`
            <div id='columns-div-${selectionIndex}' class='selection-row selections-container-column'>
                <p id='columns-${selectionIndex}'>
                </p>
            </div>`)
            // Add button each time to allow deletion
            $('#columns-' + selectionIndex).append(`<button type="button" class="close remove-row" aria-label="Close"><span aria-hidden="true">&times;</span></button>`)
            if(selection.currentDim.length < 3){                
                for (colIndex in selection.currentDim) {
                    if(colIndex == selection.currentDim.length - 1){
                        // Reached the end of the list
                        $('#columns-' + selectionIndex).append(selection.currentDim[colIndex].trim())
                    }
                    else{
                        $('#columns-' + selectionIndex).append(selection.currentDim[colIndex].trim() + ", ")
                    }
                }
            }
            else{
                $('#columns-' + selectionIndex).append(selection.currentDim[0] + " ... " + selection.currentDim[selection.currentDim.length - 1])
                // for (colIndex in selection.currentDim) {
                //     $('#columns-' + selectionIndex).append("<p>" + selection.currentDim[colIndex] + "</p>")
                // }
            }

	$('#measure-selected').append(`
            <div id='measure-div-${selectionIndex}' class='selection-row selections-container-column'>
                <p id='measure-${selectionIndex}'>
                </p>
            </div>`)
            // Add button each time to allow deletion
            $('#measure-' + selectionIndex).append(`<button type="button" class="close remove-row" aria-label="Close"><span aria-hidden="true">&times;</span></button>`)
            if(selection.currentMes.length < 3){                
                for (colIndex in selection.currentMes) {
                    if(colIndex == selection.currentMes.length - 1){
                        // Reached the end of the list
                        $('#measure-' + selectionIndex).append(selection.currentMes[colIndex].trim())
                    }
                    else{
                        $('#measure-' + selectionIndex).append(selection.currentMes[colIndex].trim() + ", ")
                    }
                }
            }
            else{
                $('#measure-' + selectionIndex).append(selection.currentMes[0] + " ... " + selection.currentMes[selection.currentMes.length - 1])
                // for (colIndex in selection.currentMes) {
                //     $('#measure-' + selectionIndex).append("<p>" + selection.currentMes[colIndex] + "</p>")
                // }
            }
        }
    }

    return {
        checkColumnNamesExist: function(currentDim, app){
            if(currentDim.length == 1 && currentDim[0].includes("of")){
                app.getList('SelectionObject', function (selectionObj) {
                    console.log(selectionObj)
                    var currentSelections = selections.updateCurrentSelections(selectionObj, currentDbs, currentTables, currentDim, currentMes)
                    currentDbs = currentSelections[0]
                    currentTables = currentSelections[1]
                    currentDim = currentSelections[2]
		            currentMes = currentSelections[3]
                });
                
            }
            return(currentDim)
        },
	updateCurrentSelections: function (selectionObj, currentDbs, currentTables, currentDim, currentMes ) {
        	// loop through each table            
	for (var fieldIndex in selectionObj.qSelectionObject.qSelections) {                
		// get the current table object                
		fieldObj = selectionObj.qSelectionObject.qSelections[fieldIndex]                
		selectedArray = fieldObj.qSelected.split(',')               
		if (fieldObj.qField === "project") {                    
			currentDbs = selectedArray                
		}                
		if (fieldObj.qField === "cube_name") {                    
			currentTables = selectedArray                
		}                
		if (fieldObj.qField === "dimension") {                    
			currentDim = selectedArray                
		}                
		if (fieldObj.qField === "measure") {                    
			currentMes = selectedArray                
		}                
		if (fieldObj.qField === "cube" && fieldObj.qSelectedCount > 1) {                    
			console.log('Too many tables. In order to maintain associations please add tables one at a time')                    
			$("#column-section").css("display", "none")                    
			$("#too-many-tables").css("display", "block")                
		}else if (fieldObj.qField === "project_name" && fieldObj.qSelectedCount > 1) {                   
			console.log('Too many tables. In order to maintain associations please add tables one at a time')                    
			$("#column-section").css("display", "none")                    
			$("#table-section").css("display", "none")                    
			$("#too-many-dbs").css("display", "block")                
		}  else {                    
			$("#column-section").css("display", "block")                    
			$("#table-section").css("display", "block")                    
			$("#too-many-tables").css("display", "none")                    
			$("#too-many-dbs").css("display", "none")                
		}           
 	}           
	return [currentDbs, currentTables, currentDim, currentMes]        
	},
        recreateSelectionRows: function(selectionObjs) {
            recreateSelectionRows(selectionObjs)
        },
        removeSelectionRow: function(rowId, selectionObjs){
            // romve this row from the users selections 
            selectionObjs.splice(rowId, 1);
            // recreate all rows to maintain the ordering
            recreateSelectionRows(selectionObjs)
        }
    }
})