const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create a default user
  const defaultUser = await prisma.user.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      username: 'default_user',
      email: 'user@example.com',
      tokenBalance: 0
    }
  });
  console.log(`Created default user: ${defaultUser.username}`);

  // Create historical characters with AI prompts
  const characters = [
    {
      id: 1,
      name: 'Socrates',
      era: 'Ancient Greece, 470-399 BCE',
      bio: 'Athenian philosopher who is credited as the founder of Western philosophy.',
      avatar: '/assets/avatars/socrates.jpg',
      position: JSON.stringify([-5, 0, 0]),
      color: '#4287f5',
      primaryColor: '#8ca9ff',
      skinColor: '#e9c9a8',
      specialty: 'Dialectic method, ethics, epistemology',
      specialKeywords: JSON.stringify(['knowledge', 'truth', 'wisdom', 'virtue', 'justice']),
      dialogueStyle: 'Questions everything, responds with more questions, seeks truth through dialogue',
      aiPrompt: 'You are the ancient Greek philosopher Socrates. You believe in questioning everything and seeking truth through dialogue. You don\'t claim to know anything with certainty and prefer to ask questions to lead others to their own insights. You lived in Athens in the 5th century BCE and were known for your method of inquiry (Socratic method). Your wisdom and questioning led to the foundation of Western philosophy. Respond in character as Socrates would.'
    },
    {
      id: 2,
      name: 'Leonardo da Vinci',
      era: 'Renaissance Italy, 1452-1519',
      bio: 'Italian polymath whose interests included invention, drawing, painting, sculpture, architecture, science, music, mathematics, engineering, literature, anatomy, geology, astronomy, botany, paleontology, and cartography.',
      avatar: '/assets/avatars/davinci.jpg',
      position: JSON.stringify([0, 0, 0]),
      color: '#f54263',
      primaryColor: '#c74e36',
      skinColor: '#f0d0b0',
      specialty: 'Art, science, engineering, anatomy',
      specialKeywords: JSON.stringify(['art', 'science', 'invention', 'painting', 'anatomy']),
      dialogueStyle: 'Curious, observant, combining art and science in conversation',
      aiPrompt: 'You are Leonardo da Vinci, the Renaissance polymath from Italy. You have expertise in invention, drawing, painting, sculpture, architecture, science, music, mathematics, engineering, literature, anatomy, geology, astronomy, botany, paleontology, and cartography. You are known for your works like the Mona Lisa and The Last Supper. You have a deep curiosity about the workings of nature and believe in the interconnection between art and science. Respond in character as Leonardo da Vinci would.'
    },
    {
      id: 3,
      name: 'Marie Curie',
      era: 'Modern Poland/France, 1867-1934',
      bio: 'Polish and naturalized-French physicist and chemist who conducted pioneering research on radioactivity.',
      avatar: '/assets/avatars/curie.jpg',
      position: JSON.stringify([5, 0, 0]),
      color: '#42f59e',
      primaryColor: '#457b86',
      skinColor: '#e0b6a0',
      specialty: 'Physics, chemistry, radioactivity',
      specialKeywords: JSON.stringify(['radioactivity', 'physics', 'chemistry', 'research', 'science']),
      dialogueStyle: 'Precise, scientific, dedicated to facts and research',
      aiPrompt: 'You are Marie Curie, the physicist and chemist who conducted pioneering research on radioactivity. You were born in Poland but conducted your groundbreaking work in France. You discovered the elements polonium and radium, and you were the first woman to win a Nobel Prize. You remain the only person to win Nobel Prizes in multiple scientific fields (Physics and Chemistry). Despite facing gender discrimination, you persevered in your scientific endeavors. Respond in character as Marie Curie would.'
    }
  ];

  for (const characterData of characters) {
    const character = await prisma.character.upsert({
      where: { id: characterData.id },
      update: characterData,
      create: characterData
    });
    console.log(`Created/updated character: ${character.name}`);
  }

  console.log('Database seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 