// MongoDB养生文章集合初始化脚本
// 在elderdiet数据库中创建health_articles集合并插入示例数据

db = db.getSiblingDB('elderdiet_dev');

// 创建养生文章集合
try {
  db.createCollection('health_articles');
  
  // 创建索引
  db.health_articles.createIndex({ "category": 1 });
  db.health_articles.createIndex({ "status": 1 });
  db.health_articles.createIndex({ "is_featured": 1 });
  db.health_articles.createIndex({ "is_carousel": 1 });
  db.health_articles.createIndex({ "created_at": -1 });
  
  print('✅ health_articles集合创建成功');
  print('🔍 创建了必要的索引');
  
} catch (error) {
  print('❌ 集合创建出错:', error);
}

// 插入示例数据
try {
  db.health_articles.insertMany([
    {
      title: "为什么晚上不能吃姜？",
      subtitle: "中医理论告诉你最佳食用时间",
      category: "中医养生",
      content: {
        paragraphs: [
          {
            type: "text",
            content: "前几天朋友问我，她妈妈习惯晚上喝姜茶暖胃，但听说\"夜不食姜\"，到底有没有道理？",
            order: 1
          },
          {
            type: "image",
            url: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800",
            caption: "新鲜生姜的功效与作用",
            alt_text: "新鲜生姜特写",
            order: 2
          },
          {
            type: "text",
            content: "其实这个说法确实有根据。中医认为生姜性温味辛，有温中散寒的作用。白天人体阳气旺盛，这时吃点姜能帮助阳气升发，特别适合脾胃虚寒的人。",
            order: 3
          },
          {
            type: "text",
            content: "但到了晚上就不一样了。夜晚本该是阴气内敛、阳气收藏的时候，如果这时候还吃温热的生姜，就像是在该睡觉的时候喝咖啡，容易让人兴奋，影响睡眠。",
            order: 4
          },
          {
            type: "image",
            url: "https://images.unsplash.com/photo-1546173159-315724a31696?w=800",
            caption: "姜茶制作方法",
            alt_text: "姜茶制作过程",
            order: 5
          },
          {
            type: "text",
            content: "不过也要看个人体质。如果你本身就是寒性体质，手脚冰凉，那晚上适量吃点姜反而有好处。但如果平时容易上火、口干舌燥，那就真的要避免夜间食姜了。",
            order: 6
          },
          {
            type: "text",
            content: "我的建议是，想吃姜的话最好安排在上午，特别是早餐时间，既能暖胃又不会影响晚上休息。",
            order: 7
          }
        ]
      },
      read_time: 3,
      tags: ["生姜", "阴阳理论", "体质调理", "睡眠"],
      cover_image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400",
      status: 1,
      is_featured: 1,
      is_carousel: 0,
      carousel_order: 0,
      created_at: new Date("2024-01-15"),
      updated_at: new Date("2024-01-15")
    },
    {
      title: "老年人补钙，别只知道喝牛奶",
      subtitle: "全面了解钙质补充的科学方法",
      category: "营养科学",
      content: {
        paragraphs: [
          {
            type: "text",
            content: "我妈今年65岁，前段时间体检发现骨密度偏低，医生建议补钙。她第一反应就是\"那我多喝点牛奶吧\"。",
            order: 1
          },
          {
            type: "image",
            url: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800",
            caption: "多种补钙食物",
            alt_text: "牛奶、豆制品、绿叶蔬菜等补钙食物",
            order: 2
          },
          {
            type: "text",
            content: "牛奶确实是很好的钙源，100毫升大概含100毫克钙，吸收率也不错。但光靠牛奶是不够的，老年人每天需要1000-1200毫克钙，相当于要喝1升牛奶，显然不现实。",
            order: 3
          },
          {
            type: "text",
            content: "其实补钙的食物选择很多。深绿色蔬菜像小白菜、芥蓝，钙含量一点不比牛奶少。豆制品也很棒，一块老豆腐的钙含量就相当于半杯牛奶。还有芝麻酱、小鱼干这些，都是补钙好手。",
            order: 4
          },
          {
            type: "image",
            url: "https://images.unsplash.com/photo-1510627489932-8c2f2c1c3c3c?w=800",
            caption: "豆制品补钙",
            alt_text: "各种豆制品",
            order: 5
          },
          {
            type: "text",
            content: "但这里有个关键点：光吃钙还不行，还得能吸收。维生素D就像钙的\"搬运工\"，没有它，吃再多钙也白搭。所以老年人最好每天晒晒太阳，15-30分钟就够了。",
            order: 6
          },
          {
            type: "text",
            content: "另外提醒一点，钙片别一次吃太多，分几次吃效果更好。最好是饭后半小时吃，这时胃酸分泌充足，有利于钙的吸收。",
            order: 7
          }
        ]
      },
      read_time: 5,
      tags: ["补钙", "骨质疏松", "维生素D", "牛奶"],
      cover_image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400",
      status: 1,
      is_featured: 1,
      is_carousel: 1,
      carousel_order: 1,
      created_at: new Date("2024-01-16"),
      updated_at: new Date("2024-01-16")
    },
    {
      title: "三高人群这样吃，血管更健康",
      subtitle: "科学饮食管理血糖血压血脂",
      category: "慢病管理",
      content: {
        paragraphs: [
          {
            type: "text",
            content: "我爸今年刚确诊糖尿病，加上之前就有的高血压，现在是妥妥的\"二高\"人群。全家人都在学习怎么调整饮食。",
            order: 1
          },
          {
            type: "image",
            url: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800",
            caption: "健康饮食搭配",
            alt_text: "营养均衡的餐食",
            order: 2
          },
          {
            type: "text",
            content: "控血糖这块，我们发现选对主食很重要。白米饭、白面条这些精制碳水升糖快，现在都换成了燕麦、荞麦、糙米。我妈还学会了看食物的升糖指数，低于55的才考虑。",
            order: 3
          },
          {
            type: "text",
            content: "降血压主要是控盐。以前炒菜习惯放很多盐，现在严格控制在每天6克以内。多用葱姜蒜、柠檬汁调味，味道其实也不错。还有就是多吃富含钾的食物，像香蕉、土豆、菠菜，能帮助排出多余的钠。",
            order: 4
          },
          {
            type: "image",
            url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800",
            caption: "低盐健康烹饪",
            alt_text: "清淡健康的菜品",
            order: 5
          },
          {
            type: "text",
            content: "血脂方面，我们减少了红肉和动物内脏，增加了深海鱼类。每周至少吃两次鱼，三文鱼、带鱼都不错。坚果也是好东西，核桃、杏仁，每天一小把。",
            order: 6
          },
          {
            type: "text",
            content: "现在我们家的标准三餐是这样的：早餐燕麦粥配水煮蛋，午餐糙米饭、清蒸鱼、绿叶菜，晚餐小米粥、蒸蛋羹、凉拌黄瓜。血糖血压都控制得不错。",
            order: 7
          }
        ]
      },
      read_time: 8,
      tags: ["三高", "血糖", "血压", "血脂", "糖尿病"],
      cover_image: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=400",
      status: 1,
      is_featured: 1,
      is_carousel: 1,
      carousel_order: 2,
      created_at: new Date("2024-01-17"),
      updated_at: new Date("2024-01-17")
    },
    {
      title: "入秋了，这样进补不上火",
      subtitle: "秋冬季节养生指南",
      category: "季节养生",
      content: {
        paragraphs: [
          {
            type: "text",
            content: "最近天气转凉，婆婆开始琢磨着要进补了。但她去年冬天补过头，结果上火长口疮，今年想换个思路。",
            order: 1
          },
          {
            type: "image",
            url: "https://images.unsplash.com/photo-1494390248081-4e521a5940db?w=800",
            caption: "秋季养生食材",
            alt_text: "银耳、百合、梨等润燥食材",
            order: 2
          },
          {
            type: "text",
            content: "秋天其实不适合大补，这个季节燥气当令，容易伤肺。我们应该先润燥，再考虑进补。像百合、银耳、梨这些白色食物就很好，能润肺止咳。",
            order: 3
          },
          {
            type: "text",
            content: "我给婆婆推荐了几个简单的方子：银耳莲子汤，既润燥又不会太凉；川贝炖梨，对秋燥咳嗽特别有效；还有百合粥，清甜润燥，老人家都爱喝。",
            order: 4
          },
          {
            type: "image",
            url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800",
            caption: "银耳莲子汤",
            alt_text: "银耳莲子汤制作",
            order: 5
          },
          {
            type: "text",
            content: "等到了真正的冬天，才是进补的好时候。那时候可以考虑一些温补的食材，像当归生姜羊肉汤、山药枸杞粥这些。但也要看个人体质，如果平时就容易上火，还是以平补为主。",
            order: 6
          },
          {
            type: "text",
            content: "记住一个原则：进补不是越多越好，关键是要适合自己。最好的进补时间是三九天，那时候人体阳气内藏，最容易吸收补品的营养。",
            order: 7
          }
        ]
      },
      read_time: 6,
      tags: ["秋冬进补", "滋阴润燥", "温阳散寒", "银耳"],
      cover_image: "https://images.unsplash.com/photo-1494390248081-4e521a5940db?w=400",
      status: 1,
      is_featured: 0,
      is_carousel: 1,
      carousel_order: 3,
      created_at: new Date("2024-01-18"),
      updated_at: new Date("2024-01-18")
    },
    {
      title: "老妈失眠，食疗比安眠药管用",
      subtitle: "天然安神助眠方法",
      category: "睡眠健康",
      content: {
        paragraphs: [
          {
            type: "text",
            content: "我妈最近总是失眠，晚上翻来覆去睡不着，白天没精神。去医院检查身体没问题，医生说可能是更年期后的睡眠障碍。",
            order: 1
          },
          {
            type: "image",
            url: "https://images.unsplash.com/photo-1510627489932-8c2f2c1c3c3d?w=800",
            caption: "安神助眠食材",
            alt_text: "酸枣仁、小米、银耳等安神食材",
            order: 2
          },
          {
            type: "text",
            content: "不想让她依赖安眠药，我们决定试试食疗的方法。中医说老年人失眠多半是心肾不交，简单说就是心火上炎，肾水不足。",
            order: 3
          },
          {
            type: "text",
            content: "我查了很多资料，发现酸枣仁是个好东西，有养心安神的作用。现在每天晚上给妈妈泡酸枣仁茶，睡前一小时喝，确实有效果。",
            order: 4
          },
          {
            type: "text",
            content: "还有就是调整晚餐。以前妈妈晚上吃得比较丰盛，现在改成清淡的小米粥配点蒸蛋羹。小米含有色氨酸，能帮助大脑产生褪黑素，有助睡眠。",
            order: 5
          },
          {
            type: "image",
            url: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800",
            caption: "小米粥助眠",
            alt_text: "小米粥制作",
            order: 6
          },
          {
            type: "text",
            content: "另外我们还做银耳百合汤，既润燥又安神。桂圆莲子羹也不错，但不能天天吃，桂圆比较温热，吃多了容易上火。",
            order: 7
          },
          {
            type: "text",
            content: "现在妈妈的睡眠明显改善了，基本不用安眠药就能睡个好觉。看来食疗虽然慢一点，但副作用小，更适合长期调理。",
            order: 8
          }
        ]
      },
      read_time: 4,
      tags: ["失眠", "安神", "食疗", "酸枣仁"],
      cover_image: "https://images.unsplash.com/photo-1510627489932-8c2f2c1c3c3d?w=400",
      status: 1,
      is_featured: 0,
      is_carousel: 0,
      carousel_order: 0,
      created_at: new Date("2024-01-19"),
      updated_at: new Date("2024-01-19")
    }
  ]);
  
  print('✅ 示例数据插入成功');
  print('📝 插入了 5 条养生文章数据');
  
} catch (error) {
  print('❌ 数据插入出错:', error);
}

// 查询验证
try {
  const count = db.health_articles.countDocuments();
  const featured = db.health_articles.countDocuments({ is_featured: 1 });
  const carousel = db.health_articles.countDocuments({ is_carousel: 1 });
  
  print('📊 数据统计:');
  print('   总文章数:', count);
  print('   推荐文章数:', featured);
  print('   轮播文章数:', carousel);
  
} catch (error) {
  print('❌ 查询验证出错:', error);
}

print('🎉 health_articles集合初始化完成！'); 