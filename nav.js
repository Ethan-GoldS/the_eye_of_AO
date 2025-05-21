document.addEventListener('DOMContentLoaded', function () {
    const sections = [
        {
            links: ['networkStatsLink', 'gamingStatsLink'],
            contents: ['networkStatsContent', 'gamingStatsContent'],
            default: 'networkStats'
        },
        {
            links: ['theFirst150Link', 'hundredThouNodesLink', 'lCustomNodesLink'],
            contents: ['theFirst150Content', 'hundredThouNodesContent', 'lCustomNodesContent'],
            default: 'theFirst150'
        },
        {
            links: ['mainnetNodesLink', 'hbCustomNodesLink'],
            contents: ['mainnetNodesContent', 'hbCustomNodesContent'],
            default: 'mainnetNodes'
        }
    ];

    function findSectionConfigByHash(hash) {
        return sections.find(config =>
            config.links.some(linkId => hash.includes(linkId.replace('Link', '')))
        );
    }

    function switchSection(sectionId, config) {
        // Clean up all
        config.links.forEach(linkId => {
            const el = document.getElementById(linkId);
            if (el) el.classList.remove('active');
        });
        config.contents.forEach(contentId => {
            const el = document.getElementById(contentId);
            if (el) el.classList.remove('active');
        });

        // Activate selected
        const activeLink = document.getElementById(`${sectionId}Link`);
        const activeContent = document.getElementById(`${sectionId}Content`);
        if (activeLink) activeLink.classList.add('active');
        if (activeContent) activeContent.classList.add('active');

        // Push state
        window.history.pushState({ section: sectionId }, '', `#${sectionId}`);
    }

    // Bind click handlers
    sections.forEach(config => {
        config.links.forEach(linkId => {
            const link = document.getElementById(linkId);
            if (link) {
                const sectionId = linkId.replace('Link', '');
                link.addEventListener('click', function (e) {
                    e.preventDefault();
                    switchSection(sectionId, config);
                });
            }
        });
    });

    // Handle browser nav
    window.addEventListener('popstate', function (e) {
        const hash = window.location.hash.replace('#', '');
        const config = findSectionConfigByHash(hash) || sections[0];
        switchSection(hash || config.default, config);
    });

    // Load correct section on page load
    const hash = window.location.hash.replace('#', '');
    const config = findSectionConfigByHash(hash) || sections.find(cfg =>
        cfg.links.some(id => document.getElementById(id))
    ) || sections[0];
    const initial = hash || config.default;

    switchSection(initial, config);
    window.history.replaceState({ section: initial }, '', `#${initial}`);
});
