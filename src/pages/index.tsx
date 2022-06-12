import { FiCalendar, FiUser } from 'react-icons/fi';
import Link from 'next/link';
import { GetStaticProps } from 'next';

import { Header } from 'components/Header';
import { getPrismicClient } from 'services/prismic';

import styles from './home.module.scss';
import commonStyles from '../styles/common.module.scss';
import { dateFormatter } from 'utils/formatters';
import { useState } from 'react';
import { PrismicDocument } from '@prismicio/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PostRaw = PrismicDocument<Record<string, any>>;

interface Post {
  slug: string;
  title: string;
  subTitle: string;
  updatedAt: string;
  author: string;
}

interface Data {
  results: Post[];
  next_page: string | null;
}

interface MorePostsResponse {
  results: PostRaw[];
  next_page: string | null;
}

interface HomeProps {
  data: Data;
}

function formatPost(post: PostRaw): Post {
  return {
    slug: post.uid as string,
    title: post.data.title as string,
    subTitle: post.data.subtitle as string,
    updatedAt: dateFormatter(new Date(post.last_publication_date)),
    author: post.data.author as string,
  };
}

export default function Home({ data }: HomeProps) {
  const [posts, setPosts] = useState<Data>(data);

  async function handleLoadMorePosts() {
    try {
      const response = await fetch(posts.next_page || '');
      const { results, next_page }: MorePostsResponse = await response.json();

      const newPosts = results.map(formatPost);

      setPosts({ results: [...posts.results, ...newPosts], next_page });
    } catch {
      console.log('Aconteceu um erro ao tentar carregar mais posts!');
    }
  }

  return (
    <div className={styles.container}>
      <Header />

      <main className={`${commonStyles.maxWidth} ${styles.postsContainer}`}>
        <section>
          {posts.results.map((post) => (
            <div key={post.slug} className={styles.post}>
              <h2 className={styles.postTitle}>
                <Link href={`/post/${post.slug}`}>
                  <a>{post.title}</a>
                </Link>
              </h2>

              <p className={styles.postSubtitle}>{post.subTitle}</p>

              <div className={styles.postInfo}>
                <p className={styles.postInfoItem}>
                  <FiCalendar size={15} />
                  <span>{post.updatedAt}</span>
                </p>

                <p className={styles.postInfoItem}>
                  <FiUser size={15} />
                  <span>{post.author}</span>
                </p>
              </div>
            </div>
          ))}
        </section>

        {posts.next_page && (
          <button
            className={styles.loadMorePosts}
            onClick={handleLoadMorePosts}
          >
            Carregar mais posts
          </button>
        )}
      </main>
    </div>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const response = await prismic.getByType('post', { pageSize: 1 });

  const results = response.results.map(formatPost);

  const data = {
    next_page: response.next_page,
    results,
  };

  return { props: { data } };
};