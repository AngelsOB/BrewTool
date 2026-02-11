
import { getBjcpCategories } from './src/utils/bjcp';

const categories = getBjcpCategories();
console.log(`Loaded ${categories.length} categories`);
categories.forEach(c => {
  console.log(`- ${c.code}: ${c.name} (${c.styles.length} styles)`);
});
