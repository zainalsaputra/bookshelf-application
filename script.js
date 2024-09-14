let currentEditBookId = null; // Define this variable at the top

document.addEventListener("DOMContentLoaded", function () {
  const submitForm = document.getElementById("inputBook");
  submitForm.addEventListener("submit", function (event) {
    event.preventDefault();
    if (currentEditBookId) {
      editBook();
    } else {
      addBook();
    }
  });

  document.getElementById("searchBook").addEventListener("input", filterBooks);

  if (isStorageExist()) {
    loadDataFromStorage();
  }

  updateBookShelvesVisibility();
});

const books = [];
const RENDER_EVENT = "render-book";
const SAVED_EVENT = "saved-books";
const STORAGE_KEY = "BOOKSHELF_APPS";

function addBook() {
  const title = document.getElementById("inputBookTitle").value;
  const author = document.getElementById("inputBookAuthor").value;
  const year = parseInt(document.getElementById("inputBookYear").value);
  const isCompleted = document.getElementById("inputBookIsComplete").checked;
  const generatedID = generateId();
  const bookObject = generateBookObject(
    generatedID,
    title,
    author,
    year,
    isCompleted,
  );
  books.push(bookObject);

  Swal.fire({
    title: "Sukses!",
    text: "Buku telah berhasil ditambahkan!",
    icon: "success",
    confirmButtonText: "OK",
  }).then(() => {
    resetForm();
    document.dispatchEvent(new Event(RENDER_EVENT));
    saveData();
  });
}

function editBook() {
  const title = document.getElementById("inputBookTitle").value;
  const author = document.getElementById("inputBookAuthor").value;
  const year = parseInt(document.getElementById("inputBookYear").value);
  const isCompleted = document.getElementById("inputBookIsComplete").checked;

  const book = findBook(currentEditBookId);
  if (book) {
    book.title = title;
    book.author = author;
    book.year = year;
    book.isCompleted = isCompleted;

    Swal.fire({
      title: "Sukses!",
      text: "Buku telah berhasil diperbarui!",
      icon: "success",
      confirmButtonText: "OK",
    }).then(() => {
      resetForm();
      document.dispatchEvent(new Event(RENDER_EVENT));
      saveData();
    });
  }
}

function showEditForm(bookId) {
  const book = findBook(bookId);
  if (book) {
    document.getElementById("inputBookTitle").value = book.title;
    document.getElementById("inputBookAuthor").value = book.author;
    document.getElementById("inputBookYear").value = book.year;
    document.getElementById("inputBookIsComplete").checked = book.isCompleted;

    currentEditBookId = bookId;
    document.getElementById("submitButton").innerText = "Simpan Perubahan";
  }
}

function resetForm() {
  document.getElementById("inputBookTitle").value = "";
  document.getElementById("inputBookAuthor").value = "";
  document.getElementById("inputBookYear").value = "";
  document.getElementById("inputBookIsComplete").checked = false;
  currentEditBookId = null;
  document.getElementById("submitButton").innerText = "Tambah Buku";
}

function generateId() {
  return +new Date();
}

function generateBookObject(id, title, author, year, isCompleted) {
  return { id, title, author, year, isCompleted };
}

function makeBook(bookObject) {
  const textTitle = document.createElement("h3");
  textTitle.innerText = bookObject.title;
  textTitle.setAttribute("data-testid", "bookItemTitle");

  const textAuthor = document.createElement("p");
  textAuthor.innerText = bookObject.author;
  textAuthor.setAttribute("data-testid", "bookItemAuthor");

  const textYear = document.createElement("p");
  textYear.innerText = bookObject.year;
  textYear.setAttribute("data-testid", "bookItemYear");

  const container = document.createElement("article");
  container.classList.add("book_item");
  container.append(textTitle, textAuthor, textYear);
  container.setAttribute("id", `book-${bookObject.id}`);
  container.setAttribute("data-bookid", `book-${bookObject.id}`);
  container.setAttribute("data-testid", "bookItem");

  const buttonContainer = document.createElement("div");
  buttonContainer.classList.add("action");

  const editButton = document.createElement("button");
  editButton.classList.add("blue");
  editButton.setAttribute("data-testid", "bookItemEditButton");
  editButton.innerHTML = '<i class="fas fa-edit"></i>';
  editButton.addEventListener("click", function () {
    showEditForm(bookObject.id);
  });

  if (bookObject.isCompleted) {
    const undoButton = document.createElement("button");
    undoButton.classList.add("green");
    undoButton.setAttribute("data-testid", "bookItemIsCompleteButton");
    undoButton.innerHTML = '<i class="fas fa-undo"></i>';
    undoButton.addEventListener("click", function () {
      undoTaskFromCompleted(bookObject.id);
    });

    const deleteButton = document.createElement("button");
    deleteButton.classList.add("red");
    deleteButton.setAttribute("data-testid", "bookItemDeleteButton");
    deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
    deleteButton.addEventListener("click", function () {
      deleteBook(bookObject.id);
    });

    buttonContainer.append(editButton, undoButton, deleteButton);
  } else {
    const completeButton = document.createElement("button");
    completeButton.classList.add("green");
    completeButton.setAttribute("data-testid", "bookItemIsCompleteButton");
    completeButton.innerHTML = '<i class="fas fa-check"></i>';
    completeButton.addEventListener("click", function () {
      addTaskToCompleted(bookObject.id);
    });

    const deleteButton = document.createElement("button");
    deleteButton.classList.add("red");
    deleteButton.setAttribute("data-testid", "bookItemDeleteButton");
    deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
    deleteButton.addEventListener("click", function () {
      deleteBook(bookObject.id);
    });

    buttonContainer.append(editButton, completeButton, deleteButton);
  }

  container.append(buttonContainer);
  return container;
}

function addTaskToCompleted(bookId) {
  const bookTarget = findBook(bookId);
  if (bookTarget === null) return;

  bookTarget.isCompleted = true;
  document.dispatchEvent(new Event(RENDER_EVENT));
  saveData();
}

function findBook(bookId) {
  return books.find((book) => book.id === bookId) || null;
}

function deleteBook(bookId) {
  Swal.fire({
    title: "Apakah Anda yakin?",
    text: "Aksi ini tidak bisa dibatalkan!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Ya, hapus!",
  }).then((result) => {
    if (result.isConfirmed) {
      removeTaskFromCompleted(bookId);
      Swal.fire("Dihapus!", "Buku telah dihapus.", "success");
    }
  });
}

function removeTaskFromCompleted(bookId) {
  const bookIndex = findBookIndex(bookId);
  if (bookIndex === -1) return;

  books.splice(bookIndex, 1);
  document.dispatchEvent(new Event(RENDER_EVENT));
  saveData();
}

function undoTaskFromCompleted(bookId) {
  const bookTarget = findBook(bookId);
  if (bookTarget === null) return;

  bookTarget.isCompleted = false;
  document.dispatchEvent(new Event(RENDER_EVENT));
  saveData();
}

function findBookIndex(bookId) {
  return books.findIndex((book) => book.id === bookId);
}

function saveData() {
  if (isStorageExist()) {
    const serializedData = JSON.stringify(books);
    localStorage.setItem(STORAGE_KEY, serializedData);
    document.dispatchEvent(new Event(SAVED_EVENT));
  }
}

function isStorageExist() {
  return typeof Storage !== "undefined";
}

function loadDataFromStorage() {
  const serializedData = localStorage.getItem(STORAGE_KEY);
  const data = JSON.parse(serializedData);

  if (data !== null) {
    data.forEach((book) => books.push(book));
  }
  document.dispatchEvent(new Event(RENDER_EVENT));
}

document.addEventListener(RENDER_EVENT, function () {
  const uncompletedBOOKList = document.getElementById(
    "incompleteBookshelfList",
  );
  const completeBOOKList = document.getElementById("completeBookshelfList");

  uncompletedBOOKList.innerHTML = "";
  completeBOOKList.innerHTML = "";

  books.forEach((bookItem) => {
    const bookElement = makeBook(bookItem);
    if (bookItem.isCompleted) {
      completeBOOKList.append(bookElement);
    } else {
      uncompletedBOOKList.append(bookElement);
    }
  });

  updateBookShelvesVisibility();
});

function filterBooks() {
  const searchQuery = document.getElementById("searchBook").value.toLowerCase();
  const uncompletedBOOKList = document.getElementById(
    "incompleteBookshelfList",
  );
  const completeBOOKList = document.getElementById("completeBookshelfList");
  const noResultsMessage = document.getElementById("noResultsMessage");

  uncompletedBOOKList.innerHTML = "";
  completeBOOKList.innerHTML = "";

  let hasVisibleBooks = false;

  books.forEach((bookItem) => {
    if (bookItem.title.toLowerCase().includes(searchQuery)) {
      const bookElement = makeBook(bookItem);
      if (bookItem.isCompleted) {
        completeBOOKList.append(bookElement);
      } else {
        uncompletedBOOKList.append(bookElement);
      }
      hasVisibleBooks = true;
    }
  });

  noResultsMessage.style.display = hasVisibleBooks ? "none" : "block";
  updateBookShelvesVisibility(hasVisibleBooks);
}

function updateBookShelvesVisibility(hasVisibleBooks = true) {
  const incompleteBookshelf = document.getElementById("incompleteBookshelf");
  const completeBookshelf = document.getElementById("completeBookshelf");

  const hasUncompletedBooks = books.some((book) => !book.isCompleted);
  const hasCompletedBooks = books.some((book) => book.isCompleted);

  incompleteBookshelf.style.display =
    hasUncompletedBooks && hasVisibleBooks ? "block" : "none";
  completeBookshelf.style.display =
    hasCompletedBooks && hasVisibleBooks ? "block" : "none";
}
