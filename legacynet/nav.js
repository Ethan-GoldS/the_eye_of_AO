document.addEventListener('DOMContentLoaded', function() {
    const theFirst150Link = document.getElementById('theFirst150Link');
    const hundredThouNodesLink = document.getElementById('hundredThouNodesLink');
    const theFirst150Content = document.getElementById('theFirst150Content');
    const hundredThouNodesContent = document.getElementById('hundredThouNodesContent');
    const customNodesLink = document.getElementById('customNodesLink');
    const customNodesContent = document.getElementById('customNodesContent');

    // Function to switch between sections
    function switchSection(section) {
        // Remove active class from all links and content
        theFirst150Link.classList.remove('active');
        hundredThouNodesLink.classList.remove('active');
        customNodesLink.classList.remove('active');
        theFirst150Content.classList.remove('active');
        hundredThouNodesContent.classList.remove('active');
        customNodesContent.classList.remove('active');
        
        // Add active class to appropriate link and content
        if (section === 'theFirst150') {
            theFirst150Link.classList.add('active');
            theFirst150Content.classList.add('active');
            window.history.pushState({section: 'theFirst150'}, 'The First 150', '#theFirst150');
        } else if (section === 'hundredThouNodes') {
            hundredThouNodesLink.classList.add('active');
            hundredThouNodesContent.classList.add('active');
            window.history.pushState({section: 'hundredThouNodes'}, 'Super Clusters', '#hundredThouNodes');
        } else if (section === 'customNodes') {
            customNodesLink.classList.add('active');
            customNodesContent.classList.add('active');
            window.history.pushState({section: 'customNodes'}, 'Custom Node Dashoard', '#customNodes');
        }
    }
    
    // Event listeners for navigation
    theFirst150Link.addEventListener('click', function(e) {
        e.preventDefault();
        switchSection('theFirst150');
    });
    
    hundredThouNodesLink.addEventListener('click', function(e) {
        e.preventDefault();
        switchSection('hundredThouNodes');
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
            switchSection('theFirst150');
        }
    });
    
    // Check hash on page load
    if (window.location.hash === '#hundredThouNodes') {
        switchSection('hundredThouNodes');
    } else if (window.location.hash === '#customNodes') {
        switchSection('customNodes');
    } else {
        switchSection('theFirst150');
        window.history.replaceState({section: 'theFirst150'}, 'The First 150', '#theFirst150');
    }
});