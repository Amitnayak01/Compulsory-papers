/* SINGLE RESOURCE REGISTRY
   Resources are organized by folders and files shown in the project.
   Paths are relative to the site folder (study-guide).
*/

window.REGISTRY = {
  title: "OAVS TGT Computer Study Guide",

  root: "./",

  documents: [
    {
      name: "OAVS TGT Syllabus (Parts 1, 2 and 3)",
      file: "syllabus.pdf",
      note: "Syllabus for OAVS TGT examination — Parts 1, 2 and 3",
      action: "View syllabus",
      color: "#facc15"
    }
  ],

  subjects: [
    /* ───────────── CURRENT AFFAIRS ───────────── */
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
            ["Awards MCQ.pdf", "bank"],
            ["OAVS_TGT_Current_Affairs_Awards.pdf", "notes"]
          ]
        },
        {
          name: "Finance and Banking",
          folder: "Finance and Banking",
          files: [
            ["OAVS_Finance_Banking_MCQ.html", "quiz"],
            ["Finance_Banking MCQ.pdf", "bank"],
            ["OAVS_TGT_Current_Affairs_Finance_Banking.pdf", "notes"]
          ]
        },
        {
          name: "International happening",
          folder: "International happening",
          files: [
            ["OAVS_International_MCQ.html", "quiz"],
            ["OAVS international mcq.pdf", "bank"],
            ["OAVS_TGT_Current_Affairs_International_Defence.pdf", "notes"]
          ]
        },
        {
          name: "Politics",
          folder: "Politics",
          files: [
            ["OAVS_Politics_MCQ.html", "quiz"],
            ["Politics MCQ.pdf", "bank"],
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
          name: "Schemes",
          folder: "schemes",
          files: [
            ["OAVS_Schemes_Misc_MCQ.html", "quiz"],
            ["Schemes_Misc MCQ.pdf", "bank"],
            ["OAVS_TGT_Current_Affairs_Schemes_Misc.pdf", "notes"]
          ]
        },
        {
          name: "Science & Environment",
          folder: "science environment",
          files: [
            ["OAVS_Science_Environment_MCQ.html", "quiz"],
            ["OAVS Science_Environment Mcq.pdf", "bank"],
            ["OAVS_TGT_Current_Affairs_Science_Environment.pdf", "notes"]
          ]
        },
        {
          name: "Sports",
          folder: "Sports",
          files: [
            ["OAVS_Sports_Quiz.html", "quiz"],
            ["OAVS_Sports MCQ.pdf", "bank"],
            ["OAVS_TGT_Current_Affairs_Part1_Sports.pdf", "notes"]
          ]
        }
      ]
    },


        /* ───────────── REASONING ───────────── */
    {
      id: "reasoning",
      icon: "it",
      name: "Reasoning",
      folder: "Reasoning",

      topics: [
        {
          name: "Verbal Reasoning",
          folder: ".",
          files: [
            ["OAVS_TGT_Reasoning_01_Series.pdf", "notes"],
            ["OAVS_TGT_Reasoning_02_Ranks.pdf", "notes"],
            ["OAVS_TGT_Reasoning_03_Direction.pdf", "notes"],
            ["OAVS_TGT_Reasoning_04_Arrangement.pdf", "notes"],
            ["OAVS_TGT_Reasoning_05_Coding_Decoding.pdf", "notes"],
            ["OAVS_TGT_Reasoning_06_Analogy.pdf", "notes"],
            ["OAVS_TGT_Reasoning_07_Classification_Odd_Pair.pdf", "notes"],
            ["OAVS_TGT_Reasoning_08_Syllogism.pdf", "notes"],
            ["OAVS_TGT_Reasoning_09_Statement_Conclusion.pdf", "notes"]
          ]
        },

        {
          name: "Non-Verbal Reasoning",
          folder: ".",
          files: [
            ["OAVS_TGT_Reasoning_10_Figure_Formation.pdf", "notes"],
            ["OAVS_TGT_Reasoning_11_Dice_Cubes.pdf", "notes"],
            ["OAVS_TGT_Reasoning_12_Triangle_Counting.pdf", "notes"],
            ["OAVS_TGT_Reasoning_13_Rule_Detection.pdf", "notes"],
            ["OAVS_TGT_Reasoning_14_Images.pdf", "notes"],
            ["OAVS_TGT_Reasoning_15_Completion_of_Pattern.pdf", "notes"],
            ["OAVS_TGT_Reasoning_16_Mirror_Images.pdf", "notes"],
            ["OAVS_TGT_Reasoning_17_Figure_Matrix.pdf", "notes"],
            ["OAVS_TGT_Reasoning_18_Paper_Folding.pdf", "notes"]
          ]
        },

        {
          name: "Other Asked Questions",
          folder: "Other asked questions",
          files: [
            ["OAVS_TGT_Other_PYQ_Types.pdf", "bank"],
            ["OAVS_TGT_Reasoning_19_Blood_Relations.pdf", "notes"],
            ["OAVS_TGT_Reasoning_20_Calendar_and_Clock.pdf", "notes"],
            ["OAVS_TGT_Reasoning_21_Counting_Figures.pdf", "notes"],
            ["OAVS_TGT_Reasoning_22_Embedded_Figures.pdf", "notes"],
            ["OAVS_TGT_Reasoning_23_Venn_Diagrams.pdf", "notes"],
            ["OAVS_TGT_Reasoning_24_Mathematical_Operations.pdf", "notes"],
            ["OAVS_TGT_Reasoning_25_Alphanumeric_Series_and_Number_Puzzles.pdf", "notes"],
            ["OAVS_TGT_Reasoning_26_Arithmetic_Age_and_Comparison.pdf", "notes"],
            ["OAVS_TGT_Reasoning_27_Decision_Making_Eligibility_and_Course_of_Action.pdf", "notes"],
            ["OAVS_TGT_Reasoning_28_Cube_Painting_and_Cutting.pdf", "notes"],
            ["OAVS_TGT_Reasoning_29_Alphabet_Position_and_Word_Manipulation.pdf", "notes"]
          ]
        },

        {
          name: "PYQ",
          folder: "pyq",
          files: [
            ["OAVS_TGT_English_2019_Reasoning_Questions.pdf", "bank"],
            ["OAVS_TGT_English_2022_Complete_Reasoning_Questions_Collection.pdf", "bank"],
            ["OAVS_TGT_Mathematics_2024_Reasoning_Questions.pdf", "bank"],
            ["OAVS_TGT_Science_2024_Reasoning_Questions.pdf", "bank"],
            ["Reasoning_Questions_OAVS_TGT_Science_2024.pdf", "bank"]
          ]
        }
      ]
    }
  ]
};