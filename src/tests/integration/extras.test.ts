import request from 'supertest';
import app from '../../app';

const unico = () => Math.random().toString(36).slice(2, 8);

async function criarUsuario() {
  const nome = `user${unico()}`;
  const res = await request(app)
    .post('/api/users')
    .send({
      user: { username: nome, email: `${nome}@teste.com`, password: '12345678' },
    });
  return { token: res.body.user.token as string, username: nome, email: `${nome}@teste.com` };
}

async function criarArtigo(token: string, tag = 'teste') {
  const res = await request(app)
    .post('/api/articles')
    .set('Authorization', `Token ${token}`)
    .send({ article: { title: `A ${unico()}`, description: 'd', body: 'b', tagList: [tag] } });
  return res.body.article.slug as string;
}

describe('auth: caminhos alternativos', () => {
  it('rota protegida sem token dá 401', async () => {
    const res = await request(app).get('/api/user');
    expect(res.status).toBe(401);
  });

  it('login com senha errada falha', async () => {
    const u = await criarUsuario();
    const res = await request(app)
      .post('/api/users/login')
      .send({ user: { email: u.email, password: 'errada' } });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('cadastro sem email falha', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ user: { username: `x${unico()}`, password: '12345678' } });
    expect(res.status).toBe(422);
  });

  it('cadastro com username repetido falha', async () => {
    const u = await criarUsuario();
    const res = await request(app)
      .post('/api/users')
      .send({
        user: { username: u.username, email: `${unico()}@teste.com`, password: '12345678' },
      });
    expect(res.status).toBe(422);
  });

  it('pega e atualiza o usuário logado', async () => {
    const u = await criarUsuario();
    const get = await request(app).get('/api/user').set('Authorization', `Token ${u.token}`);
    expect(get.status).toBe(200);
    const put = await request(app)
      .put('/api/user')
      .set('Authorization', `Token ${u.token}`)
      .send({ user: { bio: 'nova bio', image: 'http://img.png' } });
    expect(put.status).toBe(200);
    expect(put.body.user.bio).toBe('nova bio');
  });
});

describe('profiles: caminhos alternativos', () => {
  it('vê perfil logado (com following)', async () => {
    const alvo = await criarUsuario();
    const eu = await criarUsuario();
    const res = await request(app)
      .get(`/api/profiles/${alvo.username}`)
      .set('Authorization', `Token ${eu.token}`);
    expect(res.status).toBe(200);
    expect(res.body.profile.following).toBe(false);
  });

  it('seguir sem token dá 401', async () => {
    const alvo = await criarUsuario();
    const res = await request(app).post(`/api/profiles/${alvo.username}/follow`);
    expect(res.status).toBe(401);
  });

  it('seguir perfil inexistente dá 404', async () => {
    const eu = await criarUsuario();
    const res = await request(app)
      .post('/api/profiles/ninguem-xyz/follow')
      .set('Authorization', `Token ${eu.token}`);
    expect(res.status).toBe(404); //deveria ser 404
  });
});

describe('articles: filtros e paginação', () => {
  it('filtra por tag, autor e favoritado, com limit e offset', async () => {
    const autor = await criarUsuario();
    const leitor = await criarUsuario();
    const tag = `tag${unico()}`;
    const slug = await criarArtigo(autor.token, tag);
    await request(app)
      .post(`/api/articles/${slug}/favorite`)
      .set('Authorization', `Token ${leitor.token}`);

    const porTag = await request(app)
      .get(`/api/articles?tag=${tag}`)
      .set('Authorization', `Token ${leitor.token}`);
    expect(porTag.status).toBe(200);
    const porAutor = await request(app)
      .get(`/api/articles?author=${autor.username}`)
      .set('Authorization', `Token ${leitor.token}`);
    expect(porAutor.status).toBe(200);
    const porFav = await request(app)
      .get(`/api/articles?favorited=${leitor.username}`)
      .set('Authorization', `Token ${leitor.token}`);
    expect(porFav.status).toBe(200);
    const pagina = await request(app).get('/api/articles?limit=1&offset=0');
    expect(pagina.status).toBe(200);
  });

  it('feed sem token dá 401', async () => {
    const res = await request(app).get('/api/articles/feed');
    expect(res.status).toBe(401);
  });

  it('apagar artigo de outro usuário dá 403', async () => {
    const autor = await criarUsuario();
    const outro = await criarUsuario();
    const slug = await criarArtigo(autor.token);
    const res = await request(app)
      .delete(`/api/articles/${slug}`)
      .set('Authorization', `Token ${outro.token}`);
    expect(res.status).toBe(403);
  });

  it('comentário vazio falha e outro usuário não apaga comentário', async () => {
    const autor = await criarUsuario();
    const outro = await criarUsuario();
    const slug = await criarArtigo(autor.token);
    const vazio = await request(app)
      .post(`/api/articles/${slug}/comments`)
      .set('Authorization', `Token ${autor.token}`)
      .send({ comment: { body: '' } });
    expect(vazio.status).toBe(422);

    const c = await request(app)
      .post(`/api/articles/${slug}/comments`)
      .set('Authorization', `Token ${autor.token}`)
      .send({ comment: { body: 'oi' } });
    const id = c.body.comment.id;
    const del = await request(app)
      .delete(`/api/articles/${slug}/comments/${id}`)
      .set('Authorization', `Token ${outro.token}`);
    expect(del.status).toBe(404);
    const delOk = await request(app)
      .delete(`/api/articles/${slug}/comments/${id}`)
      .set('Authorization', `Token ${autor.token}`);
    expect(delOk.status).toBeLessThan(300);
  });

  it('favoritar slug inexistente dá 404', async () => {
    const u = await criarUsuario();
    const res = await request(app)
      .post('/api/articles/nao-existe/favorite')
      .set('Authorization', `Token ${u.token}`);
    expect(res.status).toBe(404);
  });
});

describe('tags', () => {
  it('lista tags sem token e com token', async () => {
    const u = await criarUsuario();
    await criarArtigo(u.token, `tag${unico()}`);
    const semToken = await request(app).get('/api/tags');
    expect(semToken.status).toBe(200);
    const comToken = await request(app).get('/api/tags').set('Authorization', `Token ${u.token}`);
    expect(comToken.status).toBe(200);
    expect(comToken.body.tags.length).toBeGreaterThan(0);
  });
});
