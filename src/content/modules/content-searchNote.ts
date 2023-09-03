import $ from 'jquery'

function initSearchNote() {
    console.log('initSearchNote')
    document.querySelector('.note')!.addEventListener('click', function () {
        if (document.getElementById('searchNoteInput')) return
        $('.readerNotePanel').prepend('<div id=\'noteTools\' style="display: flex;flex-direction: column;align-items: stretch;"><input type="text" id="searchNoteInput" style="background:transparent; font-size: 16px;padding: 12px 20px 12px 40px;border:1px groove; flex-grow: 1;" placeholder="搜索..."></div>')
        $('#searchNoteInput').on('keyup', function () {
            const input = $(this)
            const filter = (input.val() as string).toUpperCase()
            $('.sectionListItem').each((idx, el) => {
                const div = $(el)
                const text = div.find('div.text').text().toUpperCase()
                const abstract = div.find('div.abstract').text().toUpperCase()
                const title = div.find('div.sectionListItem_title').text()
                if (text.indexOf(filter) > -1
                || abstract.indexOf(filter) > -1
                || title.indexOf(filter) > -1) {
                    div.css('display', 'block')
                } else {
                    div.css('display', 'none')
                }
            })
        })
    })
}

export { initSearchNote }
