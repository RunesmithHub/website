A capability says what your plugin does beyond working inside the editor through the SDK. You declare each one with a reason, users read the
reasons before they install, and the hub checks your compiled code against what you declared.

| Capability | Users see | Declare it when your code |
| --- | --- | --- |
| `network` | Connects to the internet or other computers | Uses HTTP clients, sockets, WebSockets, DNS, or the SDK's network services |
| `process` | Starts other programs | Starts processes or uses the SDK's launcher |
| `filesystem` | Reads or writes files outside your project | Uses file or directory APIs on paths the SDK did not give it |
| `environment` | Reads environment variables or system settings | Reads environment variables, the registry or user profile settings |
| `credentials` | Stores or reads passwords and tokens | Uses the SDK's secret store |
| `native` | Runs native code | Uses platform invoke, native libraries, function pointers or unsafe code |
| `dynamic-code` | Loads or generates code while running | Loads assemblies, emits code, compiles expressions or uses private reflection |

## Writing a good reason

Users decide based on your reason, so make it specific: "Reads issues from your issue tracker" is useful; "Needed for features" is not. A
reason is one sentence of at most 160 characters.

## What the hub does

- If your code uses a capability you did not declare, the release fails and the tracking issue lists where.
- If you declare a capability your code does not seem to use, the hub notes it but does not fail.
- Adding a capability in a new version always needs a person to review that version, in every tier.
- `native` and `dynamic-code` always need a review.

With `network`, also list the hosts you connect to in `networkHosts`. Use `*` when the user chooses the hosts, such as an HTTP client.

Runesmith enforces what it can at run time: the SDK's secret store, launcher and network services refuse plugins that did not declare the
matching capability.
