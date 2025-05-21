document.addEventListener('DOMContentLoaded', function() {
    // Get all elements exactly as in the working version
    const mainnetNodesLink = document.getElementById('mainnetNodesLink');
    const customNodesLink = document.getElementById('customNodesLink');
    const mainnetNodesContent = document.getElementById('mainnetNodesContent');
    const customNodesContent = document.getElementById('customNodesContent');

    // Function to switch between sections - identical to the working version
    function switchSection(section) {
        console.log("Switching to section:", section);
        
        // Remove active class from all links and content
        mainnetNodesLink.classList.remove('active');
        customNodesLink.classList.remove('active');
        mainnetNodesContent.classList.remove('active');
        customNodesContent.classList.remove('active');
        
        // Add active class to appropriate link and content
        if (section === 'mainnetNodes') {
            mainnetNodesLink.classList.add('active');
            mainnetNodesContent.classList.add('active');
            window.history.pushState({section: 'mainnetNodes'}, 'HyperBEAM Nodes', '#mainnetNodes');
        } else if (section === 'customNodes') {
            customNodesLink.classList.add('active');
            customNodesContent.classList.add('active');
            window.history.pushState({section: 'customNodes'}, 'Custom Node Dashboard', '#customNodes');
        }
    }
    
    // Event listeners for navigation
    mainnetNodesLink.addEventListener('click', function(e) {
        e.preventDefault();
        switchSection('mainnetNodes');
    });


    customNodesLink.addEventListener('click', function(e) {
        e.preventDefault();
        switchSection('customNodes');
    });

    
    // Handle browser back/forward navigation
    window.addEventListener('popstate', function(e) {
        if (e.state && e.state.section) {
            switchSection(e.state.section);
        } else {
            switchSection('mainnetNodes');
        }
    });
    
    // Check hash on page load
    console.log("Initial hash:", window.location.hash);
    if (window.location.hash === '#customNodes') {
        switchSection('customNodes');
    } else {
        switchSection('mainnetNodes');
        window.history.replaceState({section: 'mainnetNodes'}, 'HyperBEAM Nodes', '#mainnetNodes');
    }
});