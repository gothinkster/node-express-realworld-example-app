import { api, disconnect, registerUser, resetDatabase } from './helpers';
beforeEach(resetDatabase);
afterAll(disconnect);
describe('Autenticação (integração)', () => {
  it('cadastra, faz login e devolve o usuário logado', async () => {
    await registerUser('joao');

    const login = await api()
      .post('/api/users/login')
      .send({ user: { email: 'joao@teste.com', password: 'senha-forte-123' } })
      .expect(200);
    const me = await api()
      .get('/api/user')
      .set('Authorization', `Token ${login.body.user.token}`)
      .expect(200);

    expect(me.body.user).toMatchObject({ username: 'joao', email: 'joao@teste.com' });
  });
  it('recusa cadastro duplicado com 422', async () => {
    await registerUser('joao');
    await api()
      .post('/api/users')
      .send({ user: { username: 'joao', email: 'joao@teste.com', password: 'x' } })
      .expect(422);
  });
  it('recusa senha errada com 403', async () => {
    await registerUser('joao');
    await api()
      .post('/api/users/login')
      .send({ user: { email: 'joao@teste.com', password: 'errada' } })
      .expect(403);
  });
  it('responde 401 sem token em rota protegida', async () => {
    await api().get('/api/user').expect(401);
  });
});
