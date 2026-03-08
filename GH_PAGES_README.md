# Инструкция по деплою на GitHub Pages

Для аккаунта **kunickijj2010-bit**.

### 1. Создание репозитория
Создайте на GitHub новый публичный репозиторий с названием `tma-dashboard`.

### 2. Привязка локального кода
Выполните эти команды в терминале в корневой папке проекта (`Telegram-Bot-Refinement`):

```bash
git init
git add .
git commit -m "Initial commit for TMA Dashboard"
git branch -M main
git remote add origin https://github.com/kunickijj2010-bit/tma-dashboard.git
git push -u origin main
```

### 3. Настройка GitHub Pages
1. Перейдите в настройки репозитория: `Settings` -> `Pages`.
2. В разделе **Build and deployment** выберите:
   - **Source**: `GitHub Actions`.
3. После пуша кода в пункте 2, перейдите во вкладку `Actions` — там начнется сборка и деплой.

### 4. Итоговый URL
Ваш дашборд будет доступен по адресу:
`https://kunickijj2010-bit.github.io/tma-dashboard/`

Этот URL уже прописан в коде вашего бота!
