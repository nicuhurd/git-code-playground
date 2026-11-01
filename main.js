const excelLanguage = (hljs) => ({
    name: 'Excel',
    case_insensitive: true,
    contains: [
        { scope: 'string', begin: /"/, end: /"/, contains: [{ begin: /""/ }] },
        { scope: 'variable', begin: /\b[A-Z]{1,3}\$?\d+\b|\$[A-Z]{1,3}\$?\d+\b/ },
        { scope: 'symbol', begin: /\[[^\]]+\]/ },
        { scope: 'built_in', begin: /\b(?:TRUE|FALSE)\b/ },
        { scope: 'title.function', begin: /\b[A-Z_][A-Z0-9_.]*(?=\s*\()/ },
        { scope: 'number', begin: /\b\d+(?:\.\d+)?\b/ },
        { scope: 'operator', begin: /[+\-*\/^&=<>%:;(),]/ }
    ]
});

const headings = [...document.querySelectorAll('.document h1, .document h2, .document h3')];
const toc = document.querySelector('#table-of-contents');

if (toc && headings.length) {
    const list = document.createElement('ul');
    let currentSection;

    headings.forEach((heading, index) => {
        const slug = heading.textContent
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
        heading.id = `${slug || 'sectiune'}-${index + 1}`;

        const item = document.createElement('li');
        const link = document.createElement('a');
        link.href = `#${heading.id}`;
        link.textContent = heading.textContent;
        item.append(link);

        if (heading.tagName === 'H3' && currentSection) {
            item.className = 'toc-subsection';
            currentSection.append(item);
        } else {
            list.append(item);
            currentSection = document.createElement('ul');
            item.append(currentSection);
        }
    });

    list.querySelectorAll(':scope > li > ul:empty').forEach((nestedList) => nestedList.remove());
    toc.replaceChildren(list);
}

if (window.hljs) {
    hljs.registerLanguage('excel', excelLanguage);
    hljs.highlightAll();
} else {
    const tokenPattern = /"(?:[^"]|"")*"|\$?[A-Z]{1,3}\$?\d+\b|\[[^\]]+\]|\b(?:TRUE|FALSE)\b|\b[A-Z_][A-Z0-9_.]*(?=\s*\()|\b\d+(?:\.\d+)?\b|[+\-*\/^&=<>%:;(),]/gi;
    const escapeHtml = (text) => text.replace(/[&<>"']/g, (character) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;'
    })[character]);

    document.querySelectorAll('code.language-excel').forEach((formula) => {
        let output = '';
        let position = 0;

        for (const match of formula.textContent.matchAll(tokenPattern)) {
            const token = match[0];
            const start = match.index;
            output += escapeHtml(formula.textContent.slice(position, start));
            let scope = 'operator';

            if (token.startsWith('"')) scope = 'string';
            else if (/^\$?[A-Z]{1,3}\$?\d+$/i.test(token)) scope = 'variable';
            else if (token.startsWith('[')) scope = 'symbol';
            else if (/^(TRUE|FALSE)$/i.test(token)) scope = 'built_in';
            else if (/^[A-Z_]/i.test(token) && /^\s*\(/.test(formula.textContent.slice(start + token.length))) scope = 'title function_';
            else if (/^\d/.test(token)) scope = 'number';

            output += `<span class="hljs-${scope}">${escapeHtml(token)}</span>`;
            position = start + token.length;
        }

        output += escapeHtml(formula.textContent.slice(position));
        formula.innerHTML = output;
    });
}