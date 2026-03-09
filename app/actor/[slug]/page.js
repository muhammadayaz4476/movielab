import ActorContent from "./ActorContent";

const API_KEY = process.env.NEXT_PUBLIC_TMDB_KEY;
const BASE_URL = process.env.NEXT_PUBLIC_TMDB_BASE_URL;

async function getActorData(id) {
  const url = `${BASE_URL}/person/${id}?api_key=${API_KEY}&append_to_response=combined_credits,images,external_ids`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) {
    throw new Error(`Failed to fetch actor data: ${res.statusText}`);
  }
  return res.json();
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const id = slug?.split("-").pop();

  try {
    const data = await getActorData(id);
    const name = data.name;
    const bio = data.biography || "";
    const primaryImage = data.profile_path;

    return {
      title: `${name} - Movies, Series & Biography | MovieLab`,
      description: `${name} is a ${data.known_for_department}. ${bio.substring(0, 160)}... Watch ${name}'s movies and series online free on MovieLab.`,
      openGraph: {
        title: `${name} | MovieLab`,
        description: bio.substring(0, 160),
        images: [{ url: `https://image.tmdb.org/t/p/w500${primaryImage}` }],
      },
    };
  } catch (error) {
    return { title: "Actor Details | MovieLab" };
  }
}

export default async function Page({ params }) {
  const { slug } = await params;
  const id = slug?.split("-").pop();

  let data = null;
  try {
    data = await getActorData(id);
  } catch (error) {
    console.error("Error fetching actor data:", error);
  }

  if (!data)
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white italic">
        Actor not found
      </div>
    );

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://movies.umairlab.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Actors",
        item: "https://movies.umairlab.com/actors",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: data.name,
        item: `https://movies.umairlab.com/actor/${slug}`,
      },
    ],
  };

  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: data.name,
    description: data.biography,
    image: `https://image.tmdb.org/t/p/w500${data.profile_path}`,
    birthDate: data.birthday,
    deathDate: data.deathday,
    birthPlace: data.place_of_birth,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />
      <ActorContent data={data} slug={slug} />
    </>
  );
}
