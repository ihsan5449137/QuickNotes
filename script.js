// --- Date Display ---
const dateDisplay = document.getElementById('dateDisplay');
const now = new Date();
const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
dateDisplay.textContent = now.toLocaleDateString('en-US', options);

// --- State ---
let notes = JSON.parse(localStorage.getItem('my_notes') || '[]');
let activeNoteId = null;
let deleteTargetId = null;

// --- DOM Refs ---
const notesList = document.getElementById('notesList');
const editorArea = document.getElementById('editorArea');
const searchBar = document.getElementById('searchBar');
const btnNew = document.getElementById('btnNew');
const toast = document.getElementById('toast');
const deleteModal = document.getElementById('deleteModal');
const btnCancelDelete = document.getElementById('btnCancelDelete');
const btnConfirmDelete = document.getElementById('btnConfirmDelete');

// --- Helpers ---
function save() {
    localStorage.setItem('my_notes', JSON.stringify(notes));
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function formatDate(timestamp) {
    const d = new Date(timestamp);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const month = months[d.getMonth()];
    const day = d.getDate();
    let hours = d.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const mins = d.getMinutes().toString().padStart(2, '0');
    return month + ' ' + day + ', ' + hours + ':' + mins + ' ' + ampm;
}

function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(function() {
        toast.classList.remove('show');
    }, 2000);
}

// --- Render Notes List ---
function renderList(filter) {
    filter = filter || '';
    var filtered = notes.filter(function(n) {
        if (!filter) return true;
        var q = filter.toLowerCase();
        return n.title.toLowerCase().indexOf(q) !== -1 || n.body.toLowerCase().indexOf(q) !== -1;
    });

    filtered.sort(function(a, b) {
        return b.updatedAt - a.updatedAt;
    });

    if (filtered.length === 0) {
        var msg = filter ? 'No matches found' : 'No notes yet';
        var hint = filter ? 'Try a different search' : 'Click "+ New" to start';
        notesList.innerHTML = '<div class="empty-list"><p>' + msg + '</p><span>' + hint + '</span></div>';
        return;
    }

    var html = '';
    for (var i = 0; i < filtered.length; i++) {
        var n = filtered[i];
        var isActive = n.id === activeNoteId ? ' active' : '';
        var title = n.title || 'Untitled';
        var preview = n.body || 'No content';
        html += '<div class="note-item' + isActive + '" data-id="' + n.id + '">';
        html += '<div class="note-title">' + escapeHTML(title) + '</div>';
        html += '<div class="note-preview">' + escapeHTML(preview) + '</div>';
        html += '<div class="note-date">' + formatDate(n.updatedAt) + '</div>';
        html += '</div>';
    }
    notesList.innerHTML = html;

    var items = notesList.querySelectorAll('.note-item');
    for (var j = 0; j < items.length; j++) {
        items[j].addEventListener('click', function() {
            var id = this.getAttribute('data-id');
            openNote(id);
        });
    }
}

// --- Open Note in Editor ---
function openNote(id) {
    activeNoteId = id;
    var note = null;
    for (var i = 0; i < notes.length; i++) {
        if (notes[i].id === id) {
            note = notes[i];
            break;
        }
    }
    if (!note) return;

    renderList(searchBar.value);

    editorArea.innerHTML =
        '<div class="editor-header">' +
            '<input type="text" class="editor-title" id="editorTitle" placeholder="Note title..." value="' + escapeAttr(note.title) + '" />' +
            '<div class="editor-actions">' +
                '<span class="char-count" id="charCount">' + note.body.length + ' chars</span>' +
                '<button class="btn-icon delete" id="btnDelete" title="Delete note">Delete</button>' +
            '</div>' +
        '</div>' +
        '<div class="editor-body">' +
            '<textarea class="editor-textarea" id="editorTextarea" placeholder="Start typing your note...">' + escapeHTML(note.body) + '</textarea>' +
        '</div>';

    var titleInput = document.getElementById('editorTitle');
    var textarea = document.getElementById('editorTextarea');
    var charCount = document.getElementById('charCount');
    var btnDelete = document.getElementById('btnDelete');

    titleInput.addEventListener('input', function() {
        note.title = titleInput.value;
        note.updatedAt = Date.now();
        save();
        renderList(searchBar.value);
    });

    textarea.addEventListener('input', function() {
        note.body = textarea.value;
        note.updatedAt = Date.now();
        charCount.textContent = textarea.value.length + ' chars';
        save();
        renderList(searchBar.value);
    });

    btnDelete.addEventListener('click', function() {
        deleteTargetId = id;
        deleteModal.classList.add('show');
    });

    textarea.focus();
}

function escapeHTML(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttr(str) {
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// --- New Note ---
btnNew.addEventListener('click', function() {
    var newNote = {
        id: generateId(),
        title: '',
        body: '',
        createdAt: Date.now(),
        updatedAt: Date.now()
    };
    notes.unshift(newNote);
    save();
    openNote(newNote.id);
    showToast('New note created');
});

// --- Search ---
searchBar.addEventListener('input', function() {
    renderList(searchBar.value);
});

// --- Delete Modal ---
btnCancelDelete.addEventListener('click', function() {
    deleteModal.classList.remove('show');
    deleteTargetId = null;
});

btnConfirmDelete.addEventListener('click', function() {
    if (deleteTargetId) {
        var targetId = deleteTargetId;
        notes = notes.filter(function(n) {
            return n.id !== targetId;
        });
        save();
        if (activeNoteId === targetId) {
            activeNoteId = null;
            editorArea.innerHTML =
                '<div class="empty-editor">' +
                    '<div class="big-icon">📝</div>' +
                    '<p>No note selected</p>' +
                    '<span>Click "+ New" to create a note</span>' +
                '</div>';
        }
        renderList(searchBar.value);
        showToast('Note deleted');
    }
    deleteModal.classList.remove('show');
    deleteTargetId = null;
});

deleteModal.addEventListener('click', function(e) {
    if (e.target === deleteModal) {
        deleteModal.classList.remove('show');
        deleteTargetId = null;
    }
});

// --- Init ---
renderList();

if (notes.length > 0) {
    var sorted = notes.slice().sort(function(a, b) {
        return b.updatedAt - a.updatedAt;
    });
    openNote(sorted[0].id);
}
// All Done 