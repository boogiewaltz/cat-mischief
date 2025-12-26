import { World } from '../World';

export interface Task {
  id: string;
  description: string;
  completed: boolean;
  progress: number;
  required: number;
  type: string;
}

export class TaskSystem {
  private tasks: Map<string, Task> = new Map();
  private score: number = 0;

  constructor(_world: World) {
    this.initializeTasks();
    this.setupEventListeners();
  }

  private initializeTasks(): void {
    const taskList: Task[] = [
      {
        id: 'knock_table_items',
        description: 'Knock 5 items off the dining table',
        completed: false,
        progress: 0,
        required: 5,
        type: 'knock'
      },
      {
        id: 'scratch_couch',
        description: 'Scratch the couch to 100%',
        completed: false,
        progress: 0,
        required: 1,
        type: 'scratch_complete'
      },
      {
        id: 'scratch_post',
        description: 'Scratch the scratching post to 100%',
        completed: false,
        progress: 0,
        required: 1,
        type: 'scratch_complete'
      },
      {
        id: 'knock_all_items',
        description: 'Knock 10 items total',
        completed: false,
        progress: 0,
        required: 10,
        type: 'knock'
      }
    ];

    taskList.forEach(task => {
      this.tasks.set(task.id, task);
    });

    this.updateTaskUI();
  }

  private setupEventListeners(): void {
    window.addEventListener('task-event', ((e: CustomEvent) => {
      this.handleTaskEvent(e.detail.type, e.detail.target);
    }) as EventListener);

    window.addEventListener('award-points', ((e: CustomEvent) => {
      this.addScore(e.detail.points);
    }) as EventListener);
  }

  private handleTaskEvent(eventType: string, _target: any): void {
    for (const [_id, task] of this.tasks) {
      if (task.type === eventType && !task.completed) {
        task.progress++;
        
        if (task.progress >= task.required) {
          task.completed = true;
          this.addScore(100); // Bonus for completing task
        }
        
        this.updateTaskUI();
      }
    }
  }

  private addScore(points: number): void {
    this.score += points;
    this.updateScoreUI();
  }

  private updateTaskUI(): void {
    const container = document.getElementById('tasks-container');
    if (!container) return;

    container.innerHTML = '';

    for (const [_id, task] of this.tasks) {
      const taskElement = document.createElement('div');
      taskElement.className = 'task-item';
      
      if (task.completed) {
        taskElement.classList.add('completed');
      } else if (task.progress > 0) {
        taskElement.classList.add('active');
      }

      const progressText = task.required > 1 
        ? ` (${task.progress}/${task.required})`
        : '';
      
      taskElement.textContent = task.description + progressText;
      container.appendChild(taskElement);
    }
  }

  private updateScoreUI(): void {
    const scoreElement = document.getElementById('score');
    if (scoreElement) {
      scoreElement.textContent = this.score.toString();
    }
  }

  public update(_deltaTime: number): void {
    // Task system updates (if needed)
  }

  public getScore(): number {
    return this.score;
  }

  public getTasks(): Task[] {
    return Array.from(this.tasks.values());
  }
}

