/* A readable, directly linked project collection. No carousel or hidden work. */
(() => {
    const host = document.querySelector('#projects .project-deck');
    const source = [...(host?.querySelectorAll('.gallery-deck-card') ?? [])];
    if (!source.length) return;
    const byName = new Map(source.map(card => [card.querySelector('h3').textContent, card]));
    const collection = document.createElement('div'); collection.className = 'project-collection';
    const grid = document.createElement('div'); grid.className = 'project-collection-grid'; grid.id = 'agentic';
    const definitions = [
        {name:'Pipal', type:'Agent collaboration', description:'Identity, memory, and conversations that persist. A home for Pi agents—and a way for them to work together.', tags:['Persistent context', 'Messaging & delegation'], number:'01'},
        {name:'GittyGo', type:'Developer tools', description:'A visual Git workspace for humans and agents. See what changed, review the details, and stay in control of your code.', tags:['Visual diffs', 'Local-first Git'], number:'02'},
        {name:'LAMINR', type:'Research software', description:'Explore what a neuron sees as the same. Tools for learning and aligning invariances in visual cortex.', note:'From our ICLR 2025 Oral paper', number:'03'},
        {name:'Sensorium', type:'Community benchmark', description:'Predicting the visual brain, together. A collaborative competition for modeling large-scale neural activity.', note:'NeurIPS competition · Visual neuroscience', number:'04'},
    ];
    definitions.forEach(project => {
        const original = byName.get(project.name); if (!original) return;
        const card = document.createElement('article'); card.className = 'collection-card'; card.dataset.project = project.name.toLowerCase();
        const top = document.createElement('div'); top.className = 'collection-card-top';
        const category = document.createElement('span'); category.className = 'collection-category'; category.textContent = project.type;
        const number = document.createElement('span'); number.className = 'collection-number'; number.textContent = project.number; number.setAttribute('aria-hidden','true');
        top.append(category,number);
        const logo = original.querySelector('.gallery-logo').cloneNode(true); logo.classList.add('collection-logo');
        const title = document.createElement('h3'); title.textContent = project.name;
        const description = document.createElement('p'); description.className = 'collection-description'; description.textContent = project.description;
        const link = original.querySelector('a').cloneNode(true); link.className = 'collection-link';
        link.setAttribute('aria-label', `Explore ${project.name} on GitHub`);
        link.replaceChildren(document.createTextNode('Explore project '));
        const arrow = document.createElement('span'); arrow.textContent='↗'; arrow.setAttribute('aria-hidden','true'); link.append(arrow);
        const footer = document.createElement('div'); footer.className = 'collection-card-footer';
        if (project.tags) {
            const tags=document.createElement('div');tags.className='collection-tags';
            for(const label of project.tags){const tag=document.createElement('span');tag.textContent=label;tags.append(tag);}
            footer.append(tags);
        } else {
            const note=document.createElement('p');note.className='collection-note';note.textContent=project.note;footer.append(note);
        }
        footer.append(link);card.append(top,logo,title,description,footer);grid.append(card);
    });
    collection.append(grid);
    const moreProjects = host.querySelector('.project-footnote');
    if (moreProjects) collection.append(moreProjects);
    host.replaceChildren(collection);host.classList.add('gallery-ready');
})();
