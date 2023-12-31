class Theme {
    constructor() {
      this.html = document.documentElement;
      this.html.dataset.theme = 'theme-light';
      this.themeBtn = document.querySelector('.theme-btn');
  
      this.themeBtn.addEventListener('click', this.toggleTheme.bind(this));
    }
  
    // Theme changer
    toggleTheme() {
      const themeIcon = this.themeBtn.querySelector('img');
  
      if (this.themeBtn.classList.contains('light')) {
        this.themeBtn.classList.remove('light');
        this.themeBtn.classList.add('dark');
        this.html.dataset.theme = 'theme-dark';
        themeIcon.src = './images/icon-sun.svg';
        themeIcon.alt = 'moon svg';
      } else {
        this.themeBtn.classList.remove('dark');
        this.themeBtn.classList.add('light');
        this.html.dataset.theme = 'theme-light';
        themeIcon.src = './images/icon-moon.svg';
        themeIcon.alt = 'sun svg';
      }
    }
  }
  
  class Components {
    constructor() {
      this.wrapper = document.querySelector('.wrapper');
      this.todoUl = this.wrapper.querySelector('.todos');
      this.actions = this.wrapper.querySelector('.actions');
      this.clearCompletedBtn = this.actions.querySelector('.clear-completed-btn');
      this.filterBox = this.wrapper.querySelector('.filters');
      window.addEventListener('DOMContentLoaded', () => {
        this.toggleEmptyContainer();
        this.changeUI();
      });
      window.addEventListener('resize', this.changeUI.bind(this));
    }
  
    // Empty container generator
    emptyGenerator() {
      const empty = document.createElement('div');
      empty.className = 'empty-container';
      empty.textContent = 'No todo items left!';
      return empty;
    }
  
    // changing the UI while resizing the window
    changeUI() {
      if (window.innerWidth >= 1180) {
        this.actions.insertBefore(this.filterBox, this.clearCompletedBtn);
        this.filterBox.classList.add('clear-margin');
      } else {
        this.wrapper.insertBefore(this.filterBox, document.querySelector('.drag-help-info'));
        this.filterBox.classList.remove('clear-margin');
      }
    }
  
    // checking for empty todo container
    toggleEmptyContainer() {
      switch (this.todoUl.childElementCount) {
        case 0:
          this.todoUl.append(this.emptyGenerator());
          break;
        default:
          if (this.todoUl.querySelector('.empty-container')) {
            this.todoUl.querySelector('.empty-container').remove();
          }
          break;
      }
    }
  
    // generating todo item template
    todoGenerator(text) {
      const todoItem = document.createElement('div');
      todoItem.className = 'todo-item';
      todoItem.draggable = true;
      todoItem.innerHTML = `
        <label class="check-label">
          <input type="checkbox">
          <span class="check-round"></span>
        </label>
        <li class="todo">${text}</li>
        <button class="btn delete"><img src="./images/icon-cross.svg" alt="cross svg"></button>
      `;
  
      const label = todoItem.querySelector('label');
      const li = todoItem.querySelector('li');
      const button = todoItem.querySelector('button');
  
      return [todoItem, label, li, button];
    }
  }
  
  class TodoItem extends Components {
    constructor() {
      super();
      this.addTodoBtn = document.querySelector('.add-todo');
      this.addTodoBtn.addEventListener('click', this.addTodo.bind(this));
      this.clearCompletedBtn.addEventListener('click', this.clearCompletedHandler.bind(this));
      this.filter = new Filters(this);
  
      this.renderTodos();
    }
  
    // counts active todo items
    activeTodoCount() {
      const count = this.actions.querySelector('#count');
      const wholeCount = this.todoUl.querySelectorAll('.todo-item').length;
      const inactiveCount = this.todoUl.querySelectorAll('.todo-item.strike').length;
      const activeCount = wholeCount - inactiveCount;
      count.textContent = activeCount;
    }
  
    // Adding todo
    addTodo() {
      const todoInput = document.getElementById('todo-input');
      const text = todoInput.value.trim();
      if (text === '') return;
  
      const [todoItem, checkLabel, todoLi, deleteBtn] = this.todoGenerator(text);
  
      this.todoUl.append(todoItem);
      this.toggleEmptyContainer();
      this.activeTodoCount();
      todoInput.value = '';
  
      todoItem.addEventListener('click', (e) => {
        if (e.target === checkLabel || checkLabel.querySelector('span') || checkLabel.querySelector('input')) {
          if (checkLabel.querySelector('input').checked) {
            todoItem.classList.add('strike');
          } else {
            todoItem.classList.remove('strike');
          }
          this.activeTodoCount();
          this.filter.filterHandler();
        }
  
        if (e.target === todoLi) {
          const isStrike = todoItem.classList.contains('strike');
          if (isStrike) {
            todoItem.classList.remove('strike');
            checkLabel.querySelector('input').checked = false;
          } else {
            todoItem.classList.add('strike');
            checkLabel.querySelector('input').checked = true;
          }
          this.activeTodoCount();
          this.filter.filterHandler();
        }
  
        if (e.target === deleteBtn || e.target === deleteBtn.querySelector('img')) {
          todoItem.classList.add('slide');
          todoItem.addEventListener('animationend', () => {
            todoItem.remove();
            this.toggleEmptyContainer();
            this.activeTodoCount();
            this.filter.filterHandler();
            this.updateLocalStorage();
          });
        }
      });
  
      todoItem.addEventListener('dragstart', () => {
        console.log('dragstart');
        todoItem.classList.add('ondrag');
      });
  
      todoItem.addEventListener('dragend', () => {
        console.log('dragend');
        todoItem.classList.remove('ondrag');
      });
  
      this.todoUl.addEventListener('dragenter', (e) => {
        e.preventDefault();
        const afterElement = this.getDragAfterElement(this.todoUl, e.clientY);
        const draggable = document.querySelector('.ondrag');
        if (afterElement == null) {
          this.todoUl.appendChild(draggable);
        } else {
          this.todoUl.insertBefore(draggable, afterElement);
        }
      });
  
      this.updateLocalStorage();
    }
  
    getDragAfterElement(container, y) {
      const draggableElements = [...container.querySelectorAll('.todo-item:not(.ondrag)')];
  
      return draggableElements.reduce(
        (closest, child) => {
          const box = child.getBoundingClientRect();
          const offset = y - box.top - box.height;
          if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
          } else {
            return closest;
          }
        },
        { offset: Number.NEGATIVE_INFINITY }
      ).element;
    }
  
    clearCompletedHandler() {
      const completedTodos = this.todoUl.querySelectorAll('.todo-item.strike');
      if (completedTodos.length === 0) return;
      completedTodos.forEach((completedTodo) => {
        completedTodo.classList.add('slide');
        completedTodo.addEventListener('animationend', () => {
          completedTodo.remove();
          this.toggleEmptyContainer();
          this.activeTodoCount();
          this.filter.filterHandler();
          this.updateLocalStorage();
        });
      });
    }
  
    updateLocalStorage() {
      const todos = [...this.todoUl.querySelectorAll('.todo-item')].map((todo) => ({
        id: todo.id,
        text: todo.querySelector('li').textContent,
        completed: todo.classList.contains('strike'),
      }));
      localStorage.setItem('todos', JSON.stringify(todos));
    }
  
    renderTodos() {
      const storedTodos = JSON.parse(localStorage.getItem('todos')) || [];
      storedTodos.forEach((todo) => {
        const [todoItem, checkLabel, todoLi, deleteBtn] = this.todoGenerator(todo.text);
        todoItem.id = todo.id;
        if (todo.completed) {
          todoItem.classList.add('strike');
        }
        this.todoUl.append(todoItem);
  
        // Attach event listeners to the newly rendered todo items
        todoItem.addEventListener('click', (e) => {
          if (e.target === checkLabel || checkLabel.querySelector('span') || checkLabel.querySelector('input')) {
            if (checkLabel.querySelector('input').checked) {
              todoItem.classList.add('strike');
            } else {
              todoItem.classList.remove('strike');
            }
            this.activeTodoCount();
            this.filter.filterHandler();
            this.updateLocalStorage();
          }
  
          if (e.target === todoLi) {
            const isStrike = todoItem.classList.contains('strike');
            if (isStrike) {
              todoItem.classList.remove('strike');
              checkLabel.querySelector('input').checked = false;
            } else {
              todoItem.classList.add('strike');
              checkLabel.querySelector('input').checked = true;
            }
            this.activeTodoCount();
            this.filter.filterHandler();
            this.updateLocalStorage();
          }
  
          if (e.target === deleteBtn || e.target === deleteBtn.querySelector('img')) {
            todoItem.classList.add('slide');
            todoItem.addEventListener('animationend', () => {
              todoItem.remove();
              this.toggleEmptyContainer();
              this.activeTodoCount();
              this.filter.filterHandler();
              this.updateLocalStorage();
            });
          }
        });
  
        todoItem.addEventListener('dragstart', () => {
          console.log('dragstart');
          todoItem.classList.add('ondrag');
        });
  
        todoItem.addEventListener('dragend', () => {
          console.log('dragend');
          todoItem.classList.remove('ondrag');
        });
      });
  
      this.toggleEmptyContainer();
      this.activeTodoCount();
      this.filter.filterHandler();
    }
  }
  
  class Filters {
    constructor(todo) {
      this.todo = todo;
      this.filterBox = this.todo.wrapper.querySelector('.filters');
      this.filterBox.addEventListener('click', this.filterBtnsHandler.bind(this));
    }
  
    filterBtnsHandler(e) {
    e.preventDefault();
    const allBtn = this.todo.filterBox.querySelector('.all');
    const liveBtn = this.todo.filterBox.querySelector('.live');
    const completedBtn = this.todo.filterBox.querySelector('.completed');
  
    let refValue;
  
    if (e.target.classList.contains('completed')) {
      refValue = 'completed';
      allBtn?.classList.remove('active');
      liveBtn?.classList.remove('active');
      completedBtn?.classList.add('active');
    } else if (e.target.classList.contains('live')) {
      refValue = 'live';
      allBtn?.classList.remove('active');
      liveBtn?.classList.add('active');
      completedBtn?.classList.remove('active');
    } else if (e.target.classList.contains('all')) {
      refValue = 'all';
      allBtn?.classList.add('active');
      liveBtn?.classList.remove('active');
      completedBtn?.classList.remove('active');
    }
  
    this.filterHandler(refValue);
  }
  
    filterHandler(className = 'all') {
      const allTodo = [...this.todo.todoUl.querySelectorAll('.todo-item')];
  
      switch (className) {
        case 'completed':
          allTodo.forEach((todo) => {
            if (todo.classList.contains('strike')) {
              todo.style.display = 'flex';
            } else {
              todo.style.display = 'none';
            }
          });
          break;
        case 'live':
          allTodo.forEach((todo) => {
            if (!todo.classList.contains('strike')) {
              todo.style.display = 'flex';
            } else {
              todo.style.display = 'none';
            }
          });
          break;
        case 'all':
          allTodo.forEach((todo) => {
            todo.style.display = 'flex';
          });
          break;
      }
    }
  }
  
  
  class App {
    static init() {
      new Theme();
      new TodoItem();
    }
  }
  
  App.init();