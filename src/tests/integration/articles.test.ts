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
  return { token: res.body.user.token as string, username: nome };
}

async function criarArtigo(token: string, titulo = `Artigo ${unico()}`) {
  const res = await request(app)
    .post('/api/articles')
    .set('Authorization', `Token ${token}`)
    .send({ article: { title: titulo, description: 'desc', body: 'texto', tagList: ['teste'] } });
  return res.body.article.slug as string;
}

describe('articles', () => {
  it('cria artigo', async () => {
    const { token } = await criarUsuario();
    const res = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({ article: { title: 'Olá mundo', description: 'd', body: 'b' } });
    expect(res.status).toBe(201);
    expect(res.body.article.title).toBe('Olá mundo');
  });

  it('criar sem título dá 422', async () => {
    const { token } = await criarUsuario();
    const res = await request(app)
      .post('/api/articles')
      .set('Authorization', `Token ${token}`)
      .send({ article: { description: 'd', body: 'b' } });
    expect(res.status).toBe(422);
  });

  it('lista artigos (logado vê os seus)', async () => {
    const { token } = await criarUsuario();
    const slug = await criarArtigo(token);
    const res = await request(app).get('/api/articles').set('Authorization', `Token ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.articles.some((a: any) => a.slug === slug)).toBe(true);
  });

  it('busca por slug', async () => {
    const { token } = await criarUsuario();
    const slug = await criarArtigo(token);
    const res = await request(app)
      .get(`/api/articles/${slug}`)
      .set('Authorization', `Token ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.article.slug).toBe(slug);
  });

  it('slug inexistente dá 404', async () => {
    const res = await request(app).get('/api/articles/nao-existe-mesmo');
    expect(res.status).toBe(404);
  });

  it('autor edita o artigo', async () => {
    const { token } = await criarUsuario();
    const slug = await criarArtigo(token);
    const res = await request(app)
      .put(`/api/articles/${slug}`)
      .set('Authorization', `Token ${token}`)
      .send({ article: { body: 'texto novo' } });
    expect(res.status).toBe(200);
    expect(res.body.article.body).toBe('texto novo');
  });

  it('outro usuário não pode editar (403)', async () => {
    const autor = await criarUsuario();
    const outro = await criarUsuario();
    const slug = await criarArtigo(autor.token);
    const res = await request(app)
      .put(`/api/articles/${slug}`)
      .set('Authorization', `Token ${outro.token}`)
      .send({ article: { body: 'invadido' } });
    expect(res.status).toBe(403);
  });

  it('apaga artigo', async () => {
    const { token } = await criarUsuario();
    const slug = await criarArtigo(token);
    const res = await request(app)
      .delete(`/api/articles/${slug}`)
      .set('Authorization', `Token ${token}`);
    expect(res.status).toBeLessThan(300);
    const depois = await request(app).get(`/api/articles/${slug}`);
    expect(depois.status).toBe(404);
  });

  it('comenta e lista comentários', async () => {
    const { token } = await criarUsuario();
    const slug = await criarArtigo(token);
    const res = await request(app)
      .post(`/api/articles/${slug}/comments`)
      .set('Authorization', `Token ${token}`)
      .send({ comment: { body: 'Ótimo artigo' } });
    expect(res.status).toBeLessThan(300);
    expect(res.body.comment.body).toBe('Ótimo artigo');

    const lista = await request(app)
      .get(`/api/articles/${slug}/comments`)
      .set('Authorization', `Token ${token}`);
    expect(lista.status).toBe(200);
    expect(lista.body.comments).toHaveLength(1);
  });

  it('favorita e desfavorita', async () => {
    const autor = await criarUsuario();
    const leitor = await criarUsuario();
    const slug = await criarArtigo(autor.token);

    const fav = await request(app)
      .post(`/api/articles/${slug}/favorite`)
      .set('Authorization', `Token ${leitor.token}`);
    expect(fav.status).toBeLessThan(300);
    expect(fav.body.article.favorited).toBe(true);
    expect(fav.body.article.favoritesCount).toBe(1);

    const desfav = await request(app)
      .delete(`/api/articles/${slug}/favorite`)
      .set('Authorization', `Token ${leitor.token}`);
    expect(desfav.body.article.favorited).toBe(false);
  });

  it('feed mostra artigos de quem eu sigo', async () => {
    const autor = await criarUsuario();
    const leitor = await criarUsuario();
    const slug = await criarArtigo(autor.token);
    await request(app)
      .post(`/api/profiles/${autor.username}/follow`)
      .set('Authorization', `Token ${leitor.token}`);

    const res = await request(app)
      .get('/api/articles/feed')
      .set('Authorization', `Token ${leitor.token}`);
    expect(res.status).toBe(200);
    expect(res.body.articles.some((a: any) => a.slug === slug)).toBe(true);
  });
});
