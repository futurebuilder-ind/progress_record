const user = {
  subjects: [
    {
      name: "Math",
      topics: [
        {
          name: "Algebra",
          completed: false,
          subtopics: [
            {
              name: "Linear",
              completed: true,
              tasks: [
                { name: "Read chapter 1", completed: true },
                { name: "Do exercises", completed: false }
              ]
            }
          ]
        }
      ]
    }
  ]
};

let totalTopics = 0, completedTopics = 0, totalTasks = 0, completedTasks = 0;

(user.subjects || []).forEach(sub => {
  (sub.topics || []).forEach(t => {
    totalTopics++;
    
    totalTasks++;
    if (t.completed) completedTasks++;

    const subtopics = t.subtopics || [];

    if (subtopics.length === 0) {
      if (t.completed) { completedTopics++; }
    } else {
      let topicWeight = 0, topicDone = 0;
      subtopics.forEach(st => {
        totalTasks++;
        if (st.completed) completedTasks++;

        const tasks = st.tasks || [];
        if (tasks.length === 0) {
          topicWeight++;
          if (st.completed) topicDone++;
        } else {
          tasks.forEach(task => {
            totalTasks++;
            if (task.completed) completedTasks++;
          });
          const tasksDone = tasks.filter(t => t.completed).length;
          topicWeight += tasks.length;
          topicDone += tasksDone;
        }
      });
      const topicMastery = topicWeight > 0 ? topicDone / topicWeight : (t.completed ? 1 : 0);
      if (topicMastery >= 1 || t.completed) completedTopics++;
    }
  });
});

console.log("totalTasks:", totalTasks);
console.log("completedTasks:", completedTasks);
