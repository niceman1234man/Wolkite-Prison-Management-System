// Define routes
app.use('/api/auth', require('./api/auth'));
app.use('/api/users', require('./api/users'));
app.use('/api/inmates', require('./api/inmates'));
app.use('/api/backup', require('./api/backup'));
app.use('/api/translate', require('./api/translate')); 