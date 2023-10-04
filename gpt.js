// Show the plugin UI
figma.showUI(__html__, { width: 800, height: 200 });  // Adjust dimensions as needed.

let selectedNodes = figma.currentPage.selection;

if (selectedNodes.length > 0) {
    // Apply black border to all selected nodes
    selectedNodes.forEach(node => {
        if ('strokes' in node) { // Check if the node supports the strokes property
            node.strokes = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }];
            node.strokeWeight = 5;
        }
    });

    let exportPromises = selectedNodes.map(node => {
        return node.exportAsync({ format: 'PNG' }).then(pngData => {
            // Convert the image data to a Base64 encoded string for sending to server
            const base64Image = Buffer.from(pngData).toString('base64');
            
            // Send the Base64 encoded image to the Flask server
            fetch('YOUR_FLASK_SERVER_URL/endpoint', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ image: base64Image })
            })
            .then(response => response.json())
            .then(data => {
                // Handle response from the Flask server
                console.log(data);
            })
            .catch(error => {
                console.error('Error:', error);
            });
            
            return { id: node.id, name: node.name, data: Array.from(pngData) };
        });
    });

    Promise.all(exportPromises).then(images => {
        figma.ui.postMessage({ type: 'exportImages', data: images });
    });

} else {
    figma.closePlugin('Please select layers to export.');
}

// Handle undo black border request from the UI
figma.ui.onmessage = msg => {
    if (msg.type === 'undoBorder') {
        selectedNodes.forEach(node => {
            if ('strokes' in node) {
                node.strokes = []; // Remove strokes to undo the black border
            }
        });
    }
    // ... Handle any other messages you might have ...
};
