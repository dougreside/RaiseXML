
		alert("po");
			
			ts = new TextSelector();
			sel = ts.getSelectedText();
			alert(JSON.stringify(sel));
			window.parent.showMessage(JSON.stringify(sel));
