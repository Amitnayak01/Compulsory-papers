/* SINGLE RESOURCE REGISTRY
   Resources are organized by folders and files shown in the project.
   Paths are relative to the site folder (study-guide).
*/

window.REGISTRY = {
  title: "OAVS TGT Computer Study Guide",

  root: "../",

  documents: [
  {
    name: "OAVS TGT Syllabus (Parts 1, 2 and 3)",
    file: "syllabus for part 1,2 and 3.pdf",
    note: "Syllabus for OAVS TGT examination — Parts 1, 2 and 3",
    action: "View syllabus",
    color: "#facc15"
  }
],

  subjects: [
    {
      id: "current-affairs",
      icon: "it",
      name: "Current Affairs",
      folder: "Current Affairs",

      topics: [
        {
          name: "Awards",
          folder: "Awards",

          files: [
            ["OAVS_Awards_MCQ.html", "quiz"],
            ["OAVS_Sports_Awards_MCQ.html", "quiz"],
            ["OAVS_TGT_Current_Affairs_Awards.pdf", "notes"]
          ]
        },

        {
          name: "Finance and Banking",
          folder: "Finance and Banking",

          files: [
            ["OAVS_Finance_Banking_MCQ.html", "quiz"],
            ["OAVS_TGT_Current_Affairs_Finance_Banking.pdf", "notes"],
            ["OAVS_TGT_Current_Affairs_Part4_Finance_Banking.pdf", "notes"]
          ]
        },

        {
          name: "International happening",
          folder: "International happening",

          files: [
            ["OAVS_TGT_Current_Affairs_International_Defence.pdf", "notes"]
          ]
        },

        {
          name: "Politics",
          folder: "Politics",

          files: [
            ["OAVS_Politics_MCQ.html", "quiz"],
            ["OAVS_TGT_Current_Affairs_Part3_Politics.pdf", "notes"],
            ["OAVS_TGT_Current_Affairs_Politics.pdf", "notes"]
          ]
        },

        {
          name: "PYQ",
          folder: "pyq",

          files: [
            ["Current_Affairs_Questions_OAVS_TGT_Science_2024.pdf", "bank"],
            ["Current_Affairs_Questions_OMAV_TGT_Math_2024.pdf", "bank"],
            ["OAVS_TGT_English_2019_Current_Affairs.pdf", "bank"],
            ["OAVS_TGT_English_Current_Affairs_Questions_2022.pdf", "bank"],
            ["OAVS_TGT_Social_Studies_Current_Affairs_Questions_17_May_2023.pdf", "bank"]
          ]
        },

        {
          name: "Sports",
          folder: "Sports",

          files: [
            ["OAVS_Sports_MCQ.pdf", "bank"],
            ["OAVS_Sports_Quiz.html", "quiz"],
            ["OAVS_TGT_Current_Affairs_Part1_Sports.pdf", "notes"]
          ]
        }
      ]
    }
  ]
};